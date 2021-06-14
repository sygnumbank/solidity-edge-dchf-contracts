require("@nomiclabs/hardhat-truffle5");

module.exports = {
  solidity: "0.5.12",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
  },
};
