const products = {
  AR: {
    name: "Argentina ON",
    country: "Argentina",
    route: "Simulated ALyC/PSAV route",
    institution: "Simulated Argentina ALyC/PSAV",
    maxScore: 39
  },
  MX: {
    name: "Mexico IFC",
    country: "Mexico",
    route: "IFC / Arkangeles-style route",
    institution: "Simulated Mexico IFC",
    maxScore: 59
  }
};

const state = {
  product: "AR",
  profileComplete: false,
  score: null,
  suspicious: false,
  riskReason: "",
  analysisId: null,
  reportHash: null,
  walletAddress: "",
  txHash: null,
  referralStatus: "Waiting",
  events: []
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function shortHash(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return `0x${hash.toString(16).padStart(8, "0")}...${(hash ^ 0xa43113).toString(16).padStart(8, "0")}`;
}

function addEvent(type, text) {
  state.events.unshift({ type, text, at: new Date().toLocaleTimeString() });
  render();
}

function riskLevel(score, suspicious) {
  if (score === null) return "Run wallet risk gate";
  if (suspicious || score >= 80) return "Critical · blocked";
  if (score >= 60) return "High · blocked";
  if (score >= 40) return "Medium · manual review";
  return "Low · eligible";
}

function evaluate() {
  const product = products[state.product];
  if (!state.profileComplete) return ["Not evaluated", "INVESTOR_PROFILE_REQUIRED"];
  if (state.score === null) return ["Review", "WAVY_SCORE_MISSING"];
  if (state.suspicious) return ["Blocked", "SUSPICIOUS_ACTIVITY"];
  if (state.score > product.maxScore) return ["Blocked", "WAVY_SCORE_TOO_HIGH"];
  if (state.score >= 40) return ["Review", "MANUAL_REVIEW_REQUIRED"];
  return ["Allowed", "ELIGIBLE"];
}

function render() {
  const product = products[state.product];
  const [decision, reason] = evaluate();

  $("#selectedProduct").textContent = product.name;
  $("#selectedRoute").textContent = product.route;
  $("#countryAdapter").textContent = product.country;
  $("#institution").textContent = product.institution;
  $("#score").textContent = state.score === null ? "Not scanned" : `${state.score}/100`;
  $("#riskLevel").textContent = riskLevel(state.score, state.suspicious);
  $("#decision").textContent = decision;
  $("#reason").textContent = reason;
  $("#suitability").textContent = state.profileComplete ? "Hash recorded" : "Pending";
  $("#kyc").textContent = state.profileComplete ? "Approved for demo" : "Pending";
  $("#txHash").textContent = state.txHash || "Not submitted";
  $("#referralStatus").textContent = state.referralStatus;

  const riskWidth = state.score === null ? 0 : state.score;
  $("#riskFill").style.width = `${riskWidth}%`;
  $("#riskFill").className = state.suspicious || riskWidth >= 60 ? "danger" : riskWidth >= 40 ? "review" : "allow";

  $$(".product").forEach((card) => card.classList.toggle("active", card.dataset.product === state.product));

  const list = $("#events");
  list.innerHTML = "";
  state.events.forEach((event) => {
    const item = document.createElement("li");
    item.className = event.type;
    item.textContent = `${event.at} · ${event.text}`;
    list.appendChild(item);
  });
}

function selectProduct(product) {
  state.product = product;
  state.txHash = null;
  state.referralStatus = "Waiting";
  addEvent("approved", `${products[product].name} selected. Route: ${products[product].route}.`);
}

function completeProfile() {
  state.profileComplete = true;
  addEvent("approved", `Investor profile completed for ${products[state.product].country}; suitability stored as hash.`);
}

async function loadWavyConfig() {
  try {
    const response = await fetch("/api/wavy/config");
    const payload = await response.json();
    $("#wavyStatus").textContent = payload.configured
      ? `Wavy configured · chain ${payload.chainId} · registration ${payload.registerAddresses ? "on" : "off"}`
      : `Wavy not configured: ${payload.error}`;
  } catch (error) {
    $("#wavyStatus").textContent = `Wavy config check failed: ${error.message}`;
  }
}

async function scanWavy() {
  const address = $("#walletAddress").value.trim();
  const foreignUserId = $("#foreignUserId").value.trim();
  $("#wavyStatus").textContent = "Calling Wavy Node...";

  try {
    const response = await fetch("/api/wavy/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, foreignUserId, description: `AvaReg ${products[state.product].name} investor` })
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error || "WAVY_SCAN_FAILED");
    }
    applyWavyRisk(payload.risk);
    const registrationNote = payload.registration?.warning ? ` Registration warning: ${payload.registration.message}.` : "";
    $("#wavyStatus").textContent = `Wavy scan complete. Analysis ${payload.risk.analysisId || "n/a"}.${registrationNote}`;
  } catch (error) {
    state.score = null;
    state.suspicious = false;
    state.riskReason = "";
    state.analysisId = null;
    state.reportHash = null;
    $("#wavyStatus").textContent = `Wavy scan failed: ${error.message}`;
    addEvent("blocked", `Wavy scan failed: ${error.message}.`);
    render();
  }
}

function applyWavyRisk(risk) {
  state.score = Number(risk.riskScore);
  state.suspicious = Boolean(risk.suspiciousActivity);
  state.riskReason = risk.riskReason || "";
  state.analysisId = risk.analysisId || null;
  state.reportHash = risk.reportHash || null;
  state.walletAddress = risk.address || $("#walletAddress").value.trim();
  const level = riskLevel(state.score, state.suspicious);
  addEvent(state.suspicious || state.score >= 60 ? "blocked" : state.score >= 40 ? "review" : "approved", `Wavy scan returned ${state.score}/100: ${level}. ${state.riskReason}`);
}

function requestAccess() {
  const [decision, reason] = evaluate();
  state.txHash = shortHash(`${state.product}-${state.score}-${Date.now()}`);
  state.referralStatus = decision === "Allowed" ? "ROUTED" : decision === "Review" ? "PENDING_REVIEW" : "REJECTED";
  const wavyProof = state.reportHash ? ` Wavy report hash ${state.reportHash.slice(0, 18)}...` : "";
  addEvent(decision === "Blocked" ? "blocked" : decision === "Review" ? "review" : "approved", `Referral ${state.referralStatus}: ${reason}. Tx ${state.txHash}.${wavyProof}`);
}

function transferWithScannedBuyer() {
  const [decision, reason] = evaluate();
  $("#buyer").textContent = state.walletAddress || "Scanned wallet";
  $("#buyerRisk").textContent = state.score === null ? "No Wavy scan" : `Wavy ${state.score}/100 · ${riskLevel(state.score, state.suspicious)}`;

  if (decision === "Allowed") {
    $("#transferResult").textContent = "Executed";
    $("#transferReason").textContent = reason;
    addEvent("approved", "Secondary transfer executed: scanned buyer passed investor, product and Wavy checks.");
    return;
  }

  $("#transferResult").textContent = decision === "Review" ? "Pending review" : "Blocked";
  $("#transferReason").textContent = reason;
  addEvent(decision === "Review" ? "review" : "blocked", `Secondary transfer ${decision.toLowerCase()}: ${reason}.`);
}

function resetDemo() {
  state.product = "AR";
  state.profileComplete = false;
  state.score = null;
  state.suspicious = false;
  state.riskReason = "";
  state.analysisId = null;
  state.reportHash = null;
  state.walletAddress = "";
  state.txHash = null;
  state.referralStatus = "Waiting";
  state.events = [];
  $("#buyer").textContent = "Not selected";
  $("#buyerRisk").textContent = "Run transfer check";
  $("#transferResult").textContent = "Pending";
  $("#transferReason").textContent = "ComplianceModule not called yet";
  render();
}

function runScenario() {
  resetDemo();
  selectProduct("AR");
  completeProfile();
  addEvent("review", "Run Wavy scan with configured credentials, then request access and execute transfer.");
}

$$(".nav").forEach((button) => {
  button.addEventListener("click", () => {
    $$(".nav").forEach((item) => item.classList.remove("active"));
    $$(".view").forEach((view) => view.classList.remove("active"));
    button.classList.add("active");
    $(`#${button.dataset.tab}`).classList.add("active");
  });
});

$("#selectAR").addEventListener("click", () => selectProduct("AR"));
$("#selectMX").addEventListener("click", () => selectProduct("MX"));
$("#completeProfile").addEventListener("click", completeProfile);
$("#scanWavy").addEventListener("click", scanWavy);
$("#requestAccess").addEventListener("click", requestAccess);
$("#transferWithScannedBuyer").addEventListener("click", transferWithScannedBuyer);
$("#resetDemo").addEventListener("click", resetDemo);
$("#runScenario").addEventListener("click", runScenario);

render();
loadWavyConfig();
