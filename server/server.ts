import express from "express";
import cors from "cors";
import { connectDB } from "./database";
import { appRoutes } from "./routes";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();
const port = process.env.API_PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Montar las rutas principales de AvaReg
app.use(appRoutes);

app.listen(port, async () => {
  await connectDB();
  console.log(`🚀 Nuevo servidor API AvaReg corriendo en http://localhost:${port}`);
});