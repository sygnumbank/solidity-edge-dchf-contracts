require("@nomiclabs/hardhat-truffle5");
require("solidity-coverage");

module.exports = {
  solidity: "0.5.12",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
  },
};
