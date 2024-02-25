const { deployContract } = require("../shared/helpers")

const network = (process.env.HARDHAT_NETWORK || 'mainnet')
const layerZeroData = require("../../data/layer-zero-data")[network]

async function main() {
  const userMintable = network === "arbitrumSepolia" || network === "mainnet"

  await deployContract("FXDX", [userMintable, layerZeroData.endpoint])
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
