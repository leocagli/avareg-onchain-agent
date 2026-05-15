import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

export const connectDB = async (): Promise<void> => {
  try {
    // Usamos una base de datos local para desarrollo
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/avareg";
    await mongoose.connect(mongoUri);
    console.log("🟢 Conectado exitosamente a MongoDB");
  } catch (error) {
    console.error("🔴 Error conectando a MongoDB:", error);
    process.exit(1);
  }
};

// Modelo base para guardar los perfiles Off-Chain (PII) 
// Se enlaza con el foreign_user_id que le enviamos a Wavy Node
const userSchema = new mongoose.Schema({
  foreign_user_id: { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true },
  givenName: { type: String, required: true },
  paternalSurname: { type: String, required: true },
  email: { type: String, required: true },
  country: { type: String, enum: ["MX", "AR"], required: true },
  // Aquí guardaremos el score de Wavy una vez procesado
  latestRiskScore: { type: Number, default: null }
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);