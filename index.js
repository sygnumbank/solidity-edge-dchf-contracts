const TruffleContract = require("@truffle/contract");
/* eslint-disable import/no-unresolved */
const edgeTokenJson = require("./artifacts/contracts/edge/EdgeToken.sol/EdgeToken.json");
const edgeTokenProxyJson = require("./artifacts/contracts/edge/EdgeTokenProxy.sol/EdgeTokenProxy.json");
/* eslint-enable import/no-unresolved */

module.exports = {
  load: (provider) => {
    const contracts = {
      EdgeToken: TruffleContract(edgeTokenJson),
      EdgeTokenProxy: TruffleContract(edgeTokenProxyJson),
    };
    Object.values(contracts).forEach((i) => i.setProvider(provider));
    return contracts;
  },
};
