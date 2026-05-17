import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/avareg";

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado exitosamente a MongoDB");
  } catch (error) {
    console.error("❌ Error al conectar a MongoDB:", error);
    process.exit(1);
  }
};

const userSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true },
  country: { type: String, required: true },
  fullName: { type: String },
  investorType: { type: String },
  isVerified: { type: Boolean, default: false },
});

export const User = mongoose.model("User", userSchema);