import { expect } from "chai";
import { ethers, network } from "hardhat";

const parseToken = (value: string) => ethers.parseUnits(value, 18);
const parseUSDC = (value: string) => ethers.parseUnits(value, 6);
const hash = (value: string) => ethers.keccak256(ethers.toUtf8Bytes(value));

async function deployFixture(lockupUntil = 0) {
  const [admin, issuer, trd, psav, investorA, investorB, ap] = await ethers.getSigners();

  const Roles = await ethers.getContractFactory("CNVRoleRegistry");
  const roles = await Roles.deploy();

  const KYC = await ethers.getContractFactory("KYCRegistry");
  const kyc = await KYC.deploy();

  const Registry = await ethers.getContractFactory("DigitalRepresentationRegistry");
  const registry = await Registry.deploy();

  const Evidence = await ethers.getContractFactory("EvidenceLog");
  const evidence = await Evidence.deploy();

  const Compliance = await ethers.getContractFactory("ComplianceModule");
  const compliance = await Compliance.deploy(await roles.getAddress(), await kyc.getAddress(), await registry.getAddress());

  const USDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await USDC.deploy();

  const Instrument = await ethers.getContractFactory("RegulatedInstrument");
  const instrument = await Instrument.deploy("Bono AVAX 2027", "BAVAX27", await compliance.getAddress(), await evidence.getAddress());

  const Primary = await ethers.getContractFactory("PrimaryDistribution");
  const primary = await Primary.deploy(await instrument.getAddress(), await usdc.getAddress(), await evidence.getAddress(), parseUSDC("1"));

  const Secondary = await ethers.getContractFactory("PermissionedSecondaryTransfer");
  const secondary = await Secondary.deploy(await instrument.getAddress(), await usdc.getAddress(), await evidence.getAddress());

  await evidence.setWriter(await instrument.getAddress(), true);
  await evidence.setWriter(await primary.getAddress(), true);
  await evidence.setWriter(await secondary.getAddress(), true);
  await instrument.setMinter(await primary.getAddress(), true);

  await roles.grantRole(issuer.address, 0);
  await roles.grantRole(trd.address, 1);
  await roles.grantRole(psav.address, 2);
  await roles.grantRole(ap.address, 6);

  const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 365;
  await kyc.approveKYC(investorA.address, 2, hash("AR"), hash("QUALIFIED"), expiresAt, hash("investor-a"));

  await registry.registerInstrument(await instrument.getAddress(), {
    issuer: issuer.address,
    trdEntity: trd.address,
    psav: psav.address,
    minimumKYCLevel: 2,
    allowedJurisdiction: hash("AR"),
    maxHoldingBps: 10000,
    lockupUntil,
    active: true,
    paused: false,
    documentHash: hash("bono-avax-2027-term-sheet"),
    name: "Bono AVAX 2027"
  });

  await usdc.mint(investorA.address, parseUSDC("1000"));
  await usdc.mint(investorB.address, parseUSDC("1000"));

  return { admin, issuer, trd, psav, investorA, investorB, ap, roles, kyc, registry, evidence, compliance, usdc, instrument, primary, secondary };
}

describe("AvaReg Markets MVP", function () {
  it("blocks a transfer to a receiver without KYC and records the reason", async function () {
    const { investorA, investorB, usdc, instrument, primary } = await deployFixture();

    await usdc.connect(investorA).approve(await primary.getAddress(), parseUSDC("100"));
    await primary.connect(investorA).subscribe(parseToken("100"), hash("primary-a"));

    await expect(instrument.connect(investorA).transfer(investorB.address, parseToken("10")))
      .to.be.revertedWith("RECEIVER_NOT_VERIFIED");
  });

  it("allows secondary settlement after buyer KYC approval", async function () {
    const { investorA, investorB, kyc, usdc, instrument, primary, secondary } = await deployFixture();
    const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 365;

    await usdc.connect(investorA).approve(await primary.getAddress(), parseUSDC("100"));
    await primary.connect(investorA).subscribe(parseToken("100"), hash("primary-a"));

    await kyc.approveKYC(investorB.address, 2, hash("AR"), hash("QUALIFIED"), expiresAt, hash("investor-b"));
    await instrument.connect(investorA).approve(await secondary.getAddress(), parseToken("25"));
    await usdc.connect(investorB).approve(await secondary.getAddress(), parseUSDC("25"));
    await secondary.connect(investorA).createSellOrder(parseToken("25"), parseUSDC("25"));

    await expect(secondary.connect(investorB).acceptOrder(0))
      .to.emit(secondary, "SellOrderAccepted")
      .withArgs(0, investorB.address, investorA.address);

    expect(await instrument.balanceOf(investorB.address)).to.equal(parseToken("25"));
  });

  it("blocks transfers during lock-up", async function () {
    const now = (await ethers.provider.getBlock("latest"))!.timestamp;
    const { investorA, investorB, kyc, usdc, instrument, primary } = await deployFixture(now + 3600);
    const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 365;

    await kyc.approveKYC(investorB.address, 2, hash("AR"), hash("QUALIFIED"), expiresAt, hash("investor-b"));
    await usdc.connect(investorA).approve(await primary.getAddress(), parseUSDC("100"));
    await primary.connect(investorA).subscribe(parseToken("100"), hash("primary-a"));

    await expect(instrument.connect(investorA).transfer(investorB.address, parseToken("1")))
      .to.be.revertedWith("LOCKUP_ACTIVE");

    await network.provider.send("evm_increaseTime", [3601]);
    await network.provider.send("evm_mine");

    await expect(instrument.connect(investorA).transfer(investorB.address, parseToken("1")))
      .to.emit(instrument, "Transfer");
  });
});
