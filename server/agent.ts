import { Router, Request, Response, NextFunction } from "express";
import { PrivyClient } from "@privy-io/server-auth";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

export const agentRouter = Router();

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID || "mock_id",
  process.env.PRIVY_APP_SECRET || "mock_secret"
);

// Conexión a Avalanche Fuji y setup del Agente
const provider = new ethers.JsonRpcProvider(
  process.env.AVALANCHE_FUJI_RPC || "https://api.avax-test.network/ext/bc/C/rpc"
);

// Fallback temporal para la key si aún no está en el .env
const agentWallet = new ethers.Wallet(
  process.env.AGENT_PRIVATE_KEY || "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", 
  provider
);

// Middleware de autenticación (Mockeado para testeo rápido)
const verifyPrivyAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  console.warn("⚠️ ALERTA: Autenticación de Privy desactivada temporalmente para pruebas");
  next(); 
};

// Endpoint principal del On-Chain Agent
agentRouter.post("/api/attest-risk", verifyPrivyAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userAddress } = req.body;

    if (!userAddress || !ethers.isAddress(userAddress)) {
      res.status(400).json({ success: false, error: "Dirección EVM del usuario inválida" });
      return;
    }

    // MVP: Score aleatorio. Posteriormente aquí integraríamos el Wavy Node API adapter
    const riskScore = Math.floor(Math.random() * 101);

    // Empaquetar variables igual que en Solidity con keccak256(abi.encodePacked(...))
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "uint8"],
      [userAddress, riskScore]
    );

    // Firma segura utilizando la wallet del agente
    const signature = await agentWallet.signMessage(ethers.getBytes(messageHash));

    res.json({
      success: true,
      userAddress,
      riskScore,
      signature,
      agentAddress: agentWallet.address
    });
  } catch (error: any) {
    console.error("Error en On-Chain Agent:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});