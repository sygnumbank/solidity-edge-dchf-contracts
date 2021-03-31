const TruffleContract = require("@truffle/contract");
const edgeTokenJson = require("./build/contracts/EdgeToken.json");
const edgeTokenProxyJson = require("./build/contracts/EdgeTokenProxy.json");

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
