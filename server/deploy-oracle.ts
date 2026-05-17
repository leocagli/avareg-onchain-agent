import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  // 1. Obtener la cuenta de despliegue
  const [deployer] = await ethers.getSigners();

  if (!deployer) {
    throw new Error("❌ No se encontró la cuenta de despliegue. Verifica que PRIVATE_KEY esté correctamente configurada en tu .env");
  }

  console.log("🚀 Desplegando contratos con la cuenta:", deployer.address);

  // La dirección del agente será la que está en tu .env, o la del deployer por defecto
  let agentWallet = deployer.address;
  const envKey = process.env.AGENT_PRIVATE_KEY || "";
  if (envKey.startsWith("0x") || envKey.length >= 64) {
    try {
      agentWallet = new ethers.Wallet(envKey).address;
    } catch (e) {
      console.warn("⚠️ AGENT_PRIVATE_KEY en .env no es válida. Usando address del deployer.");
    }
  }

  console.log("🛡️  Configurando Agente On-Chain autorizado:", agentWallet);

  // 2. Desplegar el contrato RiskOracle
  const RiskOracle = await ethers.getContractFactory("RiskOracle");
  const oracle = await RiskOracle.deploy(agentWallet);
  await oracle.waitForDeployment();

  console.log("✅ RiskOracle desplegado en Avalanche Fuji en la dirección:", await oracle.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});