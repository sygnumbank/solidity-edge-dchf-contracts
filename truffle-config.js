const HDWalletProvider = require("@truffle/hdwallet-provider");
require('dotenv').config();

module.exports = {
  networks: {
    development: {
      host: process.env.BLOCKCHAIN_HOST || "localhost",
      port: process.env.BLOCKCHAIN_PORT || 8545,
      network_id: "*", 
    },
    ropsten: {
      provider: () => new HDWalletProvider(process.env.ROPSTEN_MNENOMIC_PHRASE, process.env.ROPSTEN_PROVIDER),
      gasPrice: 10000000000,
      network_id: 3
    }, 
    mainnet: {
      provider: () => new HDWalletProvider(process.env.MAINNET_MNENOMIC_PHRASE, process.env.MAINNET_PROVIDER),
      gasPrice: 10000000000,
      network_id: "1"
    },
    soliditycoverage: {
      host: process.env.BLOCKCHAIN_HOST,
      port: process.env.BLOCKCHAIN_PORT,
      gas: 0xfffffffffff,
      gasLimit: 0xfffffffffff,
      gasPrice: 0x01,
      network_id: "*"
    },
  },
  plugins: ["solidity-coverage", "verify-on-etherscan"],
  compilers: {
    solc: {
      version: "0.5.12",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
     }
    }
  }
}
