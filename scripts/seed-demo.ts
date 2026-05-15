import { ethers } from "hardhat";

const hash = (value: string) => ethers.keccak256(ethers.toUtf8Bytes(value));

async function main() {
  const [admin, argentinaInstitution, mexicoInstitution, investorAR, investorMX, riskyBuyer, agent] = await ethers.getSigners();

  console.log("Demo actors");
  console.log({
    admin: admin.address,
    argentinaInstitution: argentinaInstitution.address,
    mexicoInstitution: mexicoInstitution.address,
    investorAR: investorAR.address,
    investorMX: investorMX.address,
    riskyBuyer: riskyBuyer.address,
    agent: agent.address
  });

  console.log("Seed checklist");
  console.log("1. Register Argentina ALyC/PSAV-style institution with country AR.");
  console.log("2. Register Mexico IFC-style institution with country MX.");
  console.log("3. Create Product 0: Argentina tokenized ON simulation.");
  console.log("4. Create Product 1: Mexico IFC participation simulation.");
  console.log("5. Run scripts/serve-frontend.js and scan investor wallets through the real Wavy Node API.");
  console.log("6. Attest accepted Wavy results to RiskOracle with the backend/operator wallet.");
  console.log("7. Create referrals and transfer requests from the frontend or Hardhat console.");
  console.log({ AR: hash("AR"), MX: hash("MX"), ON: hash("TOKENIZED_ON"), IFC: hash("IFC_PARTICIPATION") });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
