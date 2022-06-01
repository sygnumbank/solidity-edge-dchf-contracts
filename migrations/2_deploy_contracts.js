const EdgeToken = artifacts.require("EdgeToken");
const EdgeTokenConstructorUpgrade = artifacts.require("EdgeTokenConstructorUpgrade");
const EdgeTokenWhitelistableUpgrade = artifacts.require("EdgeTokenWhitelistableUpgrade");
const EdgeTokenBlockUnblockTraderUpgrade = artifacts.require("EdgeTokenBlockUnblockTraderUpgrade");
const EdgeTokenDecimalUpgrade = artifacts.require("EdgeTokenDecimalUpgrade");
const EdgeTokenSystemConfiscateUpgrade = artifacts.require("EdgeTokenSystemConfiscateUpgrade");
const EdgeTokenProxy = artifacts.require("EdgeTokenProxy");
const encodeCall = require("zos-lib/lib/helpers/encodeCall");

const {
  BASE_OPERATORS_CONTRACT_ADDRESS,
  WHITELIST_CONTRACT_ADDRESS,
  TRADER_OPERATORS_CONTRACT_ADDRESS,
  BLOCKER_OPERATORS_CONTRACT_ADDRESS,
  PROXY_ADMIN,
} = require("../config/deployment");

module.exports = function (deployer, network) {
  deployer
    .deploy(EdgeToken)
    .then((edgeToken) => {
      this.edgeToken = edgeToken;

      return deployer.deploy(EdgeTokenConstructorUpgrade);
    })
    .then((edgeTokenConstructorUpgrade) => {
      this.edgeTokenConstructorUpgrade = edgeTokenConstructorUpgrade;

      return deployer.deploy(EdgeTokenWhitelistableUpgrade);
    })
    .then((edgeTokenWhitelistableUpgrade) => {
      this.edgeTokenWhitelistableUpgrade = edgeTokenWhitelistableUpgrade;

      return deployer.deploy(EdgeTokenBlockUnblockTraderUpgrade);
    })
    .then((edgeTokenBlockUnblockTraderUpgrade) => {
      this.edgeTokenBlockUnblockTraderUpgrade = edgeTokenBlockUnblockTraderUpgrade;

      return deployer.deploy(EdgeTokenDecimalUpgrade);
    })
    .then((edgeTokenDecimalUpgrade) => {
      this.edgeTokenDecimalUpgrade = edgeTokenDecimalUpgrade;

      return deployer.deploy(EdgeTokenSystemConfiscateUpgrade);
    })
    .then((edgeTokenSystemConfiscateUpgrade) => {
      this.edgeTokenSystemConfiscateUpgrade = edgeTokenSystemConfiscateUpgrade;

      const initializeData = encodeCall.default("initialize", ["address"], [BASE_OPERATORS_CONTRACT_ADDRESS]);

      return deployer.deploy(EdgeTokenProxy, this.edgeToken.address, PROXY_ADMIN, initializeData);
    })
    .then(async (edgeTokenProxy) => {
      if (network === "goerli" || network === "mumbai") {
        this.edgeTokenProxy = edgeTokenProxy;
        console.log("edgeTokenProxy", edgeTokenProxy.address);

        let currentImpl = await EdgeTokenConstructorUpgrade.at(edgeTokenProxy.address);
        await edgeTokenProxy.upgradeTo(this.edgeTokenConstructorUpgrade.address, { from: PROXY_ADMIN });
        await currentImpl.initializeConstructor();

        currentImpl = await EdgeTokenWhitelistableUpgrade.at(edgeTokenProxy.address);
        await edgeTokenProxy.upgradeTo(this.edgeTokenWhitelistableUpgrade.address, { from: PROXY_ADMIN });
        await currentImpl.initializeWhitelist(WHITELIST_CONTRACT_ADDRESS);

        currentImpl = await EdgeTokenBlockUnblockTraderUpgrade.at(edgeTokenProxy.address);
        await edgeTokenProxy.upgradeTo(this.edgeTokenBlockUnblockTraderUpgrade.address, { from: PROXY_ADMIN });
        await currentImpl.initializeBlockerTraderOperators(BLOCKER_OPERATORS_CONTRACT_ADDRESS, TRADER_OPERATORS_CONTRACT_ADDRESS);

        currentImpl = await EdgeTokenDecimalUpgrade.at(edgeTokenProxy.address);
        await edgeTokenProxy.upgradeTo(this.edgeTokenDecimalUpgrade.address, { from: PROXY_ADMIN });
        await currentImpl.initializeDecimalsConstructor();

        currentImpl = await EdgeTokenSystemConfiscateUpgrade.at(edgeTokenProxy.address);
        await edgeTokenProxy.upgradeTo(this.edgeTokenSystemConfiscateUpgrade.address, { from: PROXY_ADMIN });
        await currentImpl.initializeSystemConfiscateConstructor();
      }
    });
};
