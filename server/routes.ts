import { Router, Request, Response } from "express";
import { agentRouter } from "./agent";
import { User } from "./database";

export const appRoutes = Router();

// 1. Montar las rutas del Agente (On-Chain Agent)
appRoutes.use(agentRouter);

// 2. Healthcheck simple para validar que Express vive
appRoutes.get("/api/health", (req: Request, res: Response) => {
  res.json({ success: true, message: "AvaReg API is running!" });
});

// 3. Ejemplo usando la BD: Buscar información Off-Chain de un usuario
appRoutes.get("/api/users/:wallet", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ walletAddress: req.params.wallet });
    if (!user) {
      res.status(404).json({ success: false, error: "Usuario no encontrado" });
      return;
    }
    
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Rutas de Wavy Node (Migradas)
appRoutes.get("/api/wavy/config", (req: Request, res: Response) => {
  res.json({
    configured: true,
    chainId: process.env.WAVYNODE_CHAIN_ID || 43113,
    registerAddresses: process.env.WAVYNODE_REGISTER_ADDRESSES === "true",
    riskOracleAddress: process.env.RISK_ORACLE_ADDRESS || ""
  });
});

appRoutes.post("/api/wavy/scan", async (req: Request, res: Response) => {
  try {
    const { address, foreignUserId, description } = req.body;
    
    // Si configuraste las llaves reales en tu .env, llamamos a la API de Wavy
    if (process.env.WAVYNODE_API_KEY && process.env.WAVYNODE_URL) {
      const wavyResponse = await fetch(`${process.env.WAVYNODE_URL}/api/v1/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.WAVYNODE_API_KEY}`
        },
        body: JSON.stringify({ address, chainId: process.env.WAVYNODE_CHAIN_ID || 43113 })
      });
      
      const wavyData = await wavyResponse.json();
      if (!wavyResponse.ok) throw new Error(wavyData.message || "Error al conectar con Wavy");
      
      res.json({ success: true, risk: wavyData });
    } else {
      // Fallback: Si no hay llaves reales en el .env, usamos el simulador (Mock)
      console.warn("⚠️ WAVYNODE_API_KEY no encontrada. Usando score simulado.");
      const mockScore = Math.floor(Math.random() * 100);
      res.json({
        success: true,
        risk: {
          address,
          riskScore: mockScore,
          suspiciousActivity: mockScore >= 80,
          riskReason: mockScore >= 80 ? "Simulated high risk" : "Clean wallet",
          analysisId: `sim-${Date.now()}`,
          reportHash: `0x${Date.now().toString(16)}`
        }
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});