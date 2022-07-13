const { ethers, upgrades } = require("hardhat");

/**
 * This script checks storage integrity between 0.5 and 0.8 versions of the latest EdgeToken implementations.
 * It uses a static JSON file derived from the EdgeTokenSystemConfiscateUpgrade.sol on develop branch at commit ca03f4d9
 * This is intended as a one-time check to migrate fully to 0.8 and assumes no further development will take place on the 0.5 contracts
 */

describe("Storage integrity", () => {
  beforeEach(async () => {
    // avoids getting spammed by unsafeAllow warnings
    upgrades.silenceWarnings();

    const signer = await ethers.getSigners().then((s) => s[0]);

    this.options = { unsafeAllow: ["constructor"], initializer: false, from: signer };

    this.EdgeTokenSystemConfiscateUpgradeOld = await ethers.getContractFactory("EdgeTokenSystemConfiscateUpgradeOld");
    this.EdgeTokenSystemConfiscateUpgradeNew = await ethers.getContractFactory("EdgeTokenSystemConfiscateUpgrade");
  });
  it("v5 from 0.5.12 to 0.8.8", async () => {
    const instance = await upgrades.deployProxy(this.EdgeTokenSystemConfiscateUpgradeOld, { ...this.options, kind: "transparent" });

    // this upgrade automatically compares storage between 0.5 and 0.8 implementations
    await upgrades.upgradeProxy(instance.address, this.EdgeTokenSystemConfiscateUpgradeNew, this.options);
  });
  it("v5 from 0.8.8 to 0.5.12", async () => {
    const instance = await upgrades.deployProxy(this.EdgeTokenSystemConfiscateUpgradeNew, { ...this.options, kind: "transparent" });

    // this upgrade automatically compares storage between 0.5 and 0.8 implementations
    await upgrades.upgradeProxy(instance.address, this.EdgeTokenSystemConfiscateUpgradeOld, this.options);
  });
});
