const { ethers, upgrades } = require("hardhat");
/**
 * This script uses the openzeppelin-upgrades plugin to test the upgrade process, performing
 * OZ's automated storage compatibility checks. It uses a transparent proxy pattern which should
 * be identical to 0.8 EdgeTokenProxy other than in name, although there should be storage slot
 * differences with the 0.5.12 proxy (the ones deployed in production as of 05.2022).
 *
 * In terms of storage layout checks, only the implementation matters and so proxy type is irrelevant
 */

describe("Upgrade", () => {
  beforeEach(async () => {
    // avoids getting spammed by unsafeAllow warnings
    upgrades.silenceWarnings();

    this.options = { unsafeAllow: ["constructor"], initializer: false };

    this.EdgeToken = await ethers.getContractFactory("EdgeToken");
    this.EdgeTokenConstructorUpgrade = await ethers.getContractFactory("EdgeTokenConstructorUpgrade");
    this.EdgeTokenWhitelistableUpgrade = await ethers.getContractFactory("EdgeTokenWhitelistableUpgrade");
    this.EdgeTokenBlockUnblockTraderUpgrade = await ethers.getContractFactory("EdgeTokenBlockUnblockTraderUpgrade");
    this.EdgeTokenDecimalUpgrade = await ethers.getContractFactory("EdgeTokenDecimalUpgrade");
    this.EdgeTokenSystemConfiscateUpgrade = await ethers.getContractFactory("EdgeTokenSystemConfiscateUpgrade");

    this.instance = await upgrades.deployProxy(this.EdgeToken, { ...this.options, kind: "transparent" });
    await this.instance.deployed();
  });
  it("upgrades from v0 to v1", async () => {
    await upgrades.upgradeProxy(this.instance, this.EdgeTokenConstructorUpgrade, this.options);
  });
  it("upgrades from v0 to v2", async () => {
    await upgrades.upgradeProxy(this.instance.address, this.EdgeTokenConstructorUpgrade, this.options);
    await upgrades.upgradeProxy(this.instance.address, this.EdgeTokenWhitelistableUpgrade, this.options);
  });
  it("upgrades from v0 to v3", async () => {
    await upgrades.upgradeProxy(this.instance.address, this.EdgeTokenConstructorUpgrade, this.options);
    await upgrades.upgradeProxy(this.instance.address, this.EdgeTokenWhitelistableUpgrade, this.options);
    await upgrades.upgradeProxy(this.instance.address, this.EdgeTokenBlockUnblockTraderUpgrade, this.options);
  });
  it("upgrades from v0 to v4", async () => {
    await upgrades.upgradeProxy(this.instance.address, this.EdgeTokenConstructorUpgrade, this.options);
    await upgrades.upgradeProxy(this.instance.address, this.EdgeTokenWhitelistableUpgrade, this.options);
    await upgrades.upgradeProxy(this.instance.address, this.EdgeTokenBlockUnblockTraderUpgrade, this.options);
    await upgrades.upgradeProxy(this.instance.address, this.EdgeTokenDecimalUpgrade, this.options);
  });
  it("upgrades from v0 to v5", async () => {
    await upgrades.upgradeProxy(this.instance.address, this.EdgeTokenConstructorUpgrade, this.options);
    await upgrades.upgradeProxy(this.instance.address, this.EdgeTokenWhitelistableUpgrade, this.options);
    await upgrades.upgradeProxy(this.instance.address, this.EdgeTokenBlockUnblockTraderUpgrade, this.options);
    await upgrades.upgradeProxy(this.instance.address, this.EdgeTokenDecimalUpgrade, this.options);
    await upgrades.upgradeProxy(this.instance.address, this.EdgeTokenSystemConfiscateUpgrade, this.options);
  });
});
