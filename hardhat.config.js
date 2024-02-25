require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-contract-sizer")
require('@typechain/hardhat')

const {
  ETHERSCAN_API_KEY,
  OPTIMISTIC_API_KEY,
  BASESCAN_API_KEY,
  arbitrumSepolia_DEPLOY_KEY,
  arbitrumSepolia_URL,
  mumbai_DEPLOY_KEY,
  mumbai_URL,
  GOERLI_URL,
  GOERLI_DEPLOY_KEY,
  MAINNET_URL,
  MAINNET_DEPLOY_KEY,
  OPTIMISM_GOERLI_URL,
  OPTIMISM_GOERLI_DEPLOY_KEY,
  OPTIMISM_URL,
  OPTIMISM_DEPLOY_KEY,
  BASE_URL,
  BASE_DEPLOY_KEY
} = require("./env.json")

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners()

  for (const account of accounts) {
    console.info(account.address)
  }
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true
    },
    // arbitrumTestnet: {
    //   url: ARBITRUM_TESTNET_URL,
    //   gasPrice: 10000000000,
    //   chainId: 421611,
    //   accounts: [ARBITRUM_TESTNET_DEPLOY_KEY]
    // },
    // arbitrum: {
    //   url: ARBITRUM_URL,
    //   gasPrice: 30000000000,
    //   chainId: 42161,
    //   accounts: [ARBITRUM_DEPLOY_KEY]
    // },
    // avax: {
    //   url: AVAX_URL,
    //   gasPrice: 200000000000,
    //   chainId: 43114,
    //   accounts: [AVAX_DEPLOY_KEY]
    // },
    // polygon: {
    //   url: POLYGON_URL,
    //   gasPrice: 100000000000,
    //   chainId: 137,
    //   accounts: [POLYGON_DEPLOY_KEY]
    // },
    // mainnet: {
    //   url: MAINNET_URL,
    //   // gasPrice: 50000000000,
    //   accounts: [MAINNET_DEPLOY_KEY]
    // },
    // goerli: {
    //   url: GOERLI_URL,
    //   // gasPrice: 10000000000,
    //   chainId: 5,
    //   accounts: [GOERLI_DEPLOY_KEY]
    // },
    // optimismGoerli: {
    //   url: OPTIMISM_GOERLI_URL,
    //   gasPrice: 200000000,
    //   chainId: 420,
    //   accounts: [OPTIMISM_GOERLI_DEPLOY_KEY]
    // },
    // optimism: {
    //   url: OPTIMISM_URL,
    //   // gasPrice: 10000000000,
    //   chainId: 10,
    //   accounts: [OPTIMISM_DEPLOY_KEY]
    // },
    // base: {
    //   url: BASE_URL,
    //   // gasPrice: 1000000000,
    //   chainId: 8453,
    //   accounts: [BASE_DEPLOY_KEY]
    // },
    arbitrumSepolia: {
      url: arbitrumSepolia_URL,
      // gasPrice: 1000000000,
      chainId: 421614,
      accounts: [arbitrumSepolia_DEPLOY_KEY]
    },
    mumbai: {
      url: mumbai_URL,
      // gasPrice: 1000000000,
      chainId: 80001,
      accounts: [mumbai_DEPLOY_KEY]
    }
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      // goerli: ETHERSCAN_API_KEY,
      // arbitrumOne: ARBISCAN_API_KEY,
      // avalanche: SNOWTRACE_API_KEY,
      // bsc: BSCSCAN_API_KEY,
      // polygon: POLYGONSCAN_API_KEY,
      // optimisticEthereum: OPTIMISTIC_API_KEY,
      // optimisticGoerli: OPTIMISTIC_API_KEY,
      base: BASESCAN_API_KEY,
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org"
        }
      }
    ]
  },
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10,
        details: {
          constantOptimizer: true,
        },
      },
    },
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
}
