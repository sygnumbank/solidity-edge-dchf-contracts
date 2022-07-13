/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("@nomiclabs/hardhat-truffle5");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@openzeppelin/hardhat-upgrades");

require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("solidity-coverage");

require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.8",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.5.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
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
  // hardhat-deploy
  namedAccounts: {
    deployer: 0,
    tokenOwner: 1,
  },
};
