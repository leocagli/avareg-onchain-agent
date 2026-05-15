import { expect } from "chai";
import { ethers } from "hardhat";

const hash = (value: string) => ethers.keccak256(ethers.toUtf8Bytes(value));
const unit = (value: string) => ethers.parseUnits(value, 18);

async function deployAgentFixture() {
  const [admin, arInstitution, mxInstitution, investorAR, investorMX, cleanBuyer, riskyBuyer, agent] = await ethers.getSigners();

  const Investors = await ethers.getContractFactory("InvestorRegistry");
  const investors = await Investors.deploy();

  const Institutions = await ethers.getContractFactory("InstitutionRegistry");
  const institutions = await Institutions.deploy();

  const Products = await ethers.getContractFactory("ProductRegistry");
  const products = await Products.deploy();

  const RiskOracle = await ethers.getContractFactory("RiskOracle");
  const riskOracle = await RiskOracle.deploy();

  const Compliance = await ethers.getContractFactory("OnChainAgentCompliance");
  const compliance = await Compliance.deploy(
    await investors.getAddress(),
    await institutions.getAddress(),
    await products.getAddress(),
    await riskOracle.getAddress()
  );

  const Referrals = await ethers.getContractFactory("ReferralRegistry");
  const referrals = await Referrals.deploy(await compliance.getAddress(), await products.getAddress(), await riskOracle.getAddress());

  const Instrument = await ethers.getContractFactory("TokenizedInstrument");
  const instrument = await Instrument.deploy("AvaReg Demo Position", "AVREG");

  const Transfers = await ethers.getContractFactory("PermissionedTransfer");
  const transfers = await Transfers.deploy(await compliance.getAddress(), await instrument.getAddress());
  await instrument.setAuthorizedInstitution(await transfers.getAddress(), true);

  await institutions.registerInstitution(arInstitution.address, hash("ALYC_PSAV"), hash("AR"), hash("AR-REG-001"), "Simulated Argentina ALyC/PSAV", true);
  await institutions.registerInstitution(mxInstitution.address, hash("IFC"), hash("MX"), hash("MX-IFC-001"), "Simulated Mexico IFC", true);

  await products.createProduct(hash("AR"), hash("TOKENIZED_ON"), arInstitution.address, hash("argentina-on-doc"), 1, 39, true, "Argentina ON tokenizada simulada");
  await products.createProduct(hash("MX"), hash("IFC_PARTICIPATION"), mxInstitution.address, hash("mexico-ifc-doc"), 1, 59, true, "Mexico IFC participation");

  await investors.setInvestorProfile(investorAR.address, hash("AR"), hash("MODERATE"), hash("INCOME"), hash("suitability-ar"), true, true);
  await investors.setInvestorProfile(investorMX.address, hash("MX"), hash("GROWTH"), hash("PRIVATE_MARKETS"), hash("suitability-mx"), true, true);
  await investors.setInvestorProfile(cleanBuyer.address, hash("AR"), hash("MODERATE"), hash("INCOME"), hash("suitability-clean"), true, true);
  await investors.setInvestorProfile(riskyBuyer.address, hash("AR"), hash("AGGRESSIVE"), hash("INCOME"), hash("suitability-risky"), true, true);

  await riskOracle.updateRiskProfile(investorAR.address, 22, false, hash("wavy-real-result-ar"));
  await riskOracle.updateRiskProfile(investorMX.address, 45, false, hash("wavy-real-result-mx"));
  await riskOracle.updateRiskProfile(cleanBuyer.address, 18, false, hash("wavy-real-result-clean"));
  await riskOracle.updateRiskProfile(riskyBuyer.address, 88, true, hash("wavy-real-result-risky"));

  await instrument.mintDemoPosition(investorAR.address, unit("100"));

  return { agent, investorAR, investorMX, cleanBuyer, riskyBuyer, compliance, referrals, instrument, transfers };
}

describe("AvaReg On-Chain Agent flow", function () {
  it("routes an eligible Argentina investor referral", async function () {
    const { agent, investorAR, referrals } = await deployAgentFixture();

    await expect(referrals.connect(investorAR).createReferral(0, agent.address, hash("risk-disclosure-ar")))
      .to.emit(referrals, "ReferralCreated")
      .withArgs(0, investorAR.address, 0, 1, "ELIGIBLE");

    const referral = await referrals.getReferral(0);
    expect(referral.status).to.equal(1);
  });

  it("puts a medium-risk Mexico investor in manual review", async function () {
    const { agent, investorMX, referrals } = await deployAgentFixture();

    await expect(referrals.connect(investorMX).createReferral(1, agent.address, hash("risk-disclosure-mx")))
      .to.emit(referrals, "ReferralCreated")
      .withArgs(0, investorMX.address, 1, 0, "MANUAL_REVIEW_REQUIRED");
  });

  it("allows clean secondary buyer and blocks suspicious buyer", async function () {
    const { investorAR, cleanBuyer, riskyBuyer, instrument, transfers } = await deployAgentFixture();

    await transfers.connect(investorAR).requestTransfer(cleanBuyer.address, 0, unit("10"));
    await expect(transfers.executeTransfer(0)).to.emit(transfers, "TransferExecuted").withArgs(0, "ELIGIBLE");
    expect(await instrument.balanceOf(cleanBuyer.address)).to.equal(unit("10"));

    await transfers.connect(investorAR).requestTransfer(riskyBuyer.address, 0, unit("10"));
    await expect(transfers.executeTransfer(1)).to.emit(transfers, "TransferBlocked").withArgs(1, "SUSPICIOUS_ACTIVITY");
  });
});
