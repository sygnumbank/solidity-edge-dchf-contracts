const EdgeToken = artifacts.require("EdgeToken");
const EdgeTokenConstructorUpgrade = artifacts.require("EdgeTokenConstructorUpgrade");
const EdgeTokenWhitelistableUpgrade = artifacts.require("EdgeTokenWhitelistableUpgrade");
const EdgeTokenBlockUnblockTraderUpgrade = artifacts.require("EdgeTokenBlockUnblockTraderUpgrade");
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

      let initializeData = encodeCall.default("initialize", ["address"], [BASE_OPERATORS_CONTRACT_ADDRESS]);

      return deployer.deploy(EdgeTokenProxy, this.edgeToken.address, PROXY_ADMIN, initializeData);
    })
    .then(async (edgeTokenProxy) => {
      if (network != "development" && network != "soliditycoverage") {
        this.edgeTokenProxy = edgeTokenProxy;
        console.log("edgeTokenProxy", edgeTokenProxy.address);

        let currentImpl = await EdgeTokenConstructorUpgrade.at(edgeTokenProxy.address);
        await edgeTokenProxy.upgradeTo(this.edgeTokenConstructorUpgrade.address);
        await currentImpl.initializeConstructor({ from: "0x0e5b1454a9b49d85F2De52D8C8027dF0EcDD5894" });

        currentImpl = await EdgeTokenWhitelistableUpgrade.at(edgeTokenProxy.address);
        await edgeTokenProxy.upgradeTo(this.edgeTokenWhitelistableUpgrade.address);
        await currentImpl.initializeWhitelist(WHITELIST_CONTRACT_ADDRESS, { from: "0x0e5b1454a9b49d85F2De52D8C8027dF0EcDD5894" });

        currentImpl = await EdgeTokenBlockUnblockTraderUpgrade.at(edgeTokenProxy.address);
        await edgeTokenProxy.upgradeTo(this.edgeTokenBlockUnblockTraderUpgrade.address);
        await currentImpl.initializeBlockerTraderOperators(BLOCKER_OPERATORS_CONTRACT_ADDRESS, TRADER_OPERATORS_CONTRACT_ADDRESS, {
          from: "0x0e5b1454a9b49d85F2De52D8C8027dF0EcDD5894",
        });
      }
    });
};
