import { Router, Request, Response } from "express";
import { agentRouter } from "./agent";
import { User } from "./database";

export const appRoutes = Router();

// 1. Montar las rutas del Agente
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