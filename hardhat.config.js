/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("@nomiclabs/hardhat-truffle5");
require("solidity-coverage");
require("dotenv").config();

module.exports = {
  solidity: "0.5.12",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    mainnet: {
      url: process.env.MAINNET_PROVIDER,
      accounts: { mnemonic: process.env.MAINNET_MNENOMIC_PHRASE },
      gasPrice: 1000000000,
      network_id: 1,
    },
    goerli: {
      url: process.env.GOERLI_PROVIDER,
      accounts: { mnemonic: process.env.GOERLI_MNENOMIC_PHRASE },
      gasPrice: 1000000000,
      network_id: 5,
    },
    mumbai: {
      url: process.env.MUMBAI_PROVIDER,
      accounts: { mnemonic: process.env.MUMBAI_MNEMONIC_PHRASE },
      gasPrice: 1000000000,
      network_id: 80001,
    },
  },
};
