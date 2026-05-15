const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "..", "frontend");
const port = Number(process.env.PORT || 3000);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8"
};

loadEnv(path.join(__dirname, "..", ".env"));

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function json(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("REQUEST_TOO_LARGE"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("INVALID_JSON"));
      }
    });
    req.on("error", reject);
  });
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function verifyWavySignature(req, body) {
  const secret = process.env.WAVYNODE_INTEGRATION_SECRET || process.env.SECRET;
  if (!secret) return false;
  const signature = req.headers["x-wavynode-hmac"];
  const timestamp = req.headers["x-wavynode-timestamp"];
  if (!signature || !timestamp) return false;

  const age = Math.abs(Date.now() - Number(timestamp));
  if (!Number.isFinite(age) || age > 300000) return false;

  const canonical = [
    req.method.toUpperCase(),
    req.url.split("?")[0].toLowerCase(),
    stableStringify(body || {}),
    timestamp
  ].join("::");
  const expected = crypto.createHmac("sha256", secret).update(canonical).digest("base64");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(String(signature));
  return expectedBuffer.length === signatureBuffer.length && crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

function requireWavyConfig() {
  const apiKey = process.env.WAVYNODE_API_KEY;
  const projectId = process.env.WAVYNODE_PROJECT_ID;
  if (!apiKey || !apiKey.startsWith("ApiKey ")) {
    throw new Error("WAVYNODE_API_KEY must be set and include the 'ApiKey ' prefix.");
  }
  if (!projectId) throw new Error("WAVYNODE_PROJECT_ID must be set.");
  return {
    apiKey,
    projectId,
    baseUrl: process.env.WAVYNODE_BASE_URL || "https://api.wavynode.com/v1",
    chainId: process.env.WAVYNODE_CHAIN_ID || "43113",
    registerAddresses: process.env.WAVYNODE_REGISTER_ADDRESSES !== "false"
  };
}

async function wavyFetch(pathname, options = {}) {
  const config = requireWavyConfig();
  const response = await fetch(`${config.baseUrl}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }
  if (!response.ok || payload.success === false) {
    const error = new Error(payload.message || payload.error || `Wavy request failed with HTTP ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function normalizeRisk(result) {
  const score = Number(result.riskScore ?? result.score ?? 0);
  const suspiciousActivity = Boolean(result.suspiciousActivity);
  const reportHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(result))
    .digest("hex");
  return {
    analysisId: result.analysisId || null,
    address: result.address,
    chainId: String(result.chainId ?? ""),
    riskScore: score,
    riskLevel: result.riskLevel || levelFor(score, suspiciousActivity),
    riskReason: result.riskReason || "",
    suspiciousActivity,
    patternsDetected: result.patternsDetected || [],
    transactionsAnalyzed: result.transactionsAnalyzed ?? null,
    completedAt: result.completedAt || null,
    reportHash: `0x${reportHash}`
  };
}

function levelFor(score, suspiciousActivity) {
  if (suspiciousActivity || score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  if (score >= 20) return "low";
  if (score >= 1) return "minimal";
  return "verified";
}

async function handleWavyScan(req, res) {
  try {
    const body = await readJson(req);
    const address = String(body.address || "").trim();
    const foreignUserId = String(body.foreignUserId || body.foreign_user_id || `avareg-${address.slice(2, 10)}`).trim();
    const description = String(body.description || "AvaReg investor wallet").trim();
    const config = requireWavyConfig();

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return json(res, 400, { success: false, error: "INVALID_EVM_ADDRESS" });
    }

    let registration = null;
    if (config.registerAddresses) {
      registration = await wavyFetch(`/projects/${encodeURIComponent(config.projectId)}/addresses`, {
        method: "POST",
        body: JSON.stringify({ address, description, foreign_user_id: foreignUserId })
      }).catch((error) => ({
        warning: "ADDRESS_REGISTRATION_FAILED",
        message: error.message,
        payload: error.payload || null
      }));
    }

    const params = new URLSearchParams({ addresses: address, chainId: String(body.chainId || config.chainId) });
    const scan = await wavyFetch(`/projects/${encodeURIComponent(config.projectId)}/addresses/scan-risk?${params.toString()}`);
    const result = scan?.data?.results?.[0];

    if (!result) {
      return json(res, 404, {
        success: false,
        error: "WAVY_RESULT_NOT_FOUND",
        registration,
        raw: scan
      });
    }

    return json(res, 200, {
      success: true,
      registration,
      risk: normalizeRisk(result),
      raw: scan
    });
  } catch (error) {
    return json(res, error.status || 500, {
      success: false,
      error: error.message,
      payload: error.payload || null
    });
  }
}

function demoUser(foreignUserId) {
  return {
    foreign_user_id: foreignUserId,
    givenName: "Maria Guadalupe",
    maternalSurname: "Sanchez",
    paternalSurname: "Rodriguez",
    birthdate: "1992-05-15",
    nationality: "MX",
    phoneNumber: {
      countryCode: "+52",
      phoneNumber: 5512345678
    },
    email: `${foreignUserId}@example.com`,
    address: {
      country: "MX",
      region: "CDMX",
      city: "Ciudad de Mexico",
      street: "Avenida Insurgentes Sur",
      colonia: "Condesa",
      exteriorNumber: "123",
      interiorNumber: "4B",
      postalCode: "06100"
    },
    mexico: {
      rfc: "ROSM920515XXX",
      curp: "ROSM920515MDFRXXXX",
      actividadEconomica: 612012,
      cuentaRelacionada: "1234567890",
      monedaCuentaRelacionada: 1,
      documentoIdentificacion: {
        tipoIdentificacion: 1,
        numeroIdentificacion: "IDMEX12345678"
      }
    }
  };
}

http.createServer((req, res) => {
  const pathname = req.url.split("?")[0];
  if (req.method === "POST" && req.url.split("?")[0] === "/api/wavy/scan") {
    handleWavyScan(req, res);
    return;
  }

  if (req.method === "GET" && pathname === "/api/wavy/config") {
    try {
      const config = requireWavyConfig();
      json(res, 200, {
        success: true,
        configured: true,
        chainId: config.chainId,
        registerAddresses: config.registerAddresses,
        baseUrl: config.baseUrl,
        integrationSecretConfigured: Boolean(process.env.WAVYNODE_INTEGRATION_SECRET || process.env.SECRET)
      });
    } catch (error) {
      json(res, 200, { success: true, configured: false, error: error.message });
    }
    return;
  }

  if (req.method === "GET" && pathname.startsWith("/users/")) {
    const body = {};
    if (!verifyWavySignature(req, body)) {
      json(res, 401, { success: false, error: "INVALID_WAVYNODE_SIGNATURE" });
      return;
    }
    json(res, 200, demoUser(decodeURIComponent(pathname.slice("/users/".length))));
    return;
  }

  if (req.method === "POST" && pathname === "/webhook") {
    readJson(req)
      .then((body) => {
        if (!verifyWavySignature(req, body)) {
          json(res, 401, { success: false, error: "INVALID_WAVYNODE_SIGNATURE" });
          return;
        }
        console.log("Wavy webhook", JSON.stringify(body));
        json(res, 200, { success: true });
      })
      .catch((error) => json(res, 400, { success: false, error: error.message }));
    return;
  }

  const urlPath = req.url === "/" ? "/index.html" : decodeURIComponent(req.url.split("?")[0]);
  const filePath = path.normalize(path.join(root, urlPath));

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(port, () => {
  console.log(`AvaReg frontend running at http://localhost:${port}`);
});
