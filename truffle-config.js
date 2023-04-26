const HDWalletProvider = require("@truffle/hdwallet-provider");
const fs = require("fs");
const path = require("path");

// Read config file if it exists
let config = { MNEMONIC: "", INFURA_KEY: "", ETHERSCAN_KEY: "" };
if (fs.existsSync(path.join(__dirname, "config.js"))) {
  config = require("./config.js");
}

module.exports = {
  compilers: {
    solc: {
      version: "0.8.13",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Match any network id
    },
    mainnet: {
      provider: infuraProvider("mainnet"),
      network_id: 1,
      gas: 5000000, // Ropsten has a lower block limit than mainnet
      gasPrice: 30000000000, // 50 gwei (in wei) (default: 100 gwei)
      networkCheckTimeout: 120000,
      skipDryRun: false, // Skip dry run before migrations? (default: false for public nets )
    },
    goerli: {
      provider: infuraProvider("goerli"),
      network_id: 5,
      gas: 5000000, // Ropsten has a lower block limit than mainnet
      // gasPrice: 80000000000, // 50 gwei (in wei) (default: 100 gwei)
      networkCheckTimeout: 120000,
      skipDryRun: false, // Skip dry run before migrations? (default: false for public nets )
    },
    sepolia: {
      provider: infuraProvider("sepolia"),
      network_id: 11155111,
      gas: 5000000,
      // gasPrice: 80000000000, // 50 gwei (in wei) (default: 100 gwei)
      networkCheckTimeout: 120000,
      skipDryRun: false, // Skip dry run before migrations? (default: false for public nets )
    },
  },
  mocha: {
    timeout: 60000, // prevents tests from failing when pc is under heavy load
    reporter: "eth-gas-reporter",
    reporterOptions: {
      currency: "USD",
    }, // See options below   // timeout: 100000
  },
  plugins: ["truffle-plugin-verify"],
  api_keys: {
    etherscan: config.ETHERSCAN_KEY,
  },
};

function infuraProvider(network) {
  return () => {
    if (!config.MNEMONIC) {
      console.error("A valid MNEMONIC must be provided in config.js");
      process.exit(1);
    }
    if (!config.INFURA_KEY) {
      console.error("A valid INFURA_KEY must be provided in config.js");
      process.exit(1);
    }
    return new HDWalletProvider(
      config.MNEMONIC,
      `https://${network}.infura.io/v3/${config.INFURA_KEY}`
    );
  };
}
