module.exports = {
  networks: {
    development: {
     host: "127.0.0.1",     // Localhost (default: none)
     port: 8545,            // Standard Ethereum port (default: none)
     network_id: "*"        // Any network (default: none)
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8555,         // <-- If you change this, also set the port option in .solcover.js.
      gas: 0xfffffffffff, // <-- Use this high gas value
      gasLimit: 0xfffffffffff, // <-- Use this high gas value
      gasPrice: 0x01      // <-- Use this low gas price
    },
  },

  mocha: {
  },

  compilers: {
    solc: {
      version: "0.5.0",    
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
     },
    }
  }

}
