import { ethers } from "hardhat";

async function main() {
  const InvestorRegistry = await ethers.getContractFactory("InvestorRegistry");
  const investors = await InvestorRegistry.deploy();
  await investors.waitForDeployment();

  const InstitutionRegistry = await ethers.getContractFactory("InstitutionRegistry");
  const institutions = await InstitutionRegistry.deploy();
  await institutions.waitForDeployment();

  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const products = await ProductRegistry.deploy();
  await products.waitForDeployment();

  const RiskOracle = await ethers.getContractFactory("RiskOracle");
  const riskOracle = await RiskOracle.deploy();
  await riskOracle.waitForDeployment();

  const Compliance = await ethers.getContractFactory("OnChainAgentCompliance");
  const compliance = await Compliance.deploy(
    await investors.getAddress(),
    await institutions.getAddress(),
    await products.getAddress(),
    await riskOracle.getAddress()
  );
  await compliance.waitForDeployment();

  const ReferralRegistry = await ethers.getContractFactory("ReferralRegistry");
  const referrals = await ReferralRegistry.deploy(
    await compliance.getAddress(),
    await products.getAddress(),
    await riskOracle.getAddress()
  );
  await referrals.waitForDeployment();

  const TokenizedInstrument = await ethers.getContractFactory("TokenizedInstrument");
  const instrument = await TokenizedInstrument.deploy("AvaReg Demo Position", "AVREG");
  await instrument.waitForDeployment();

  const PermissionedTransfer = await ethers.getContractFactory("PermissionedTransfer");
  const transfers = await PermissionedTransfer.deploy(await compliance.getAddress(), await instrument.getAddress());
  await transfers.waitForDeployment();

  await instrument.setAuthorizedInstitution(await transfers.getAddress(), true);

  console.log({
    investors: await investors.getAddress(),
    institutions: await institutions.getAddress(),
    products: await products.getAddress(),
    riskOracle: await riskOracle.getAddress(),
    compliance: await compliance.getAddress(),
    referrals: await referrals.getAddress(),
    instrument: await instrument.getAddress(),
    transfers: await transfers.getAddress()
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
