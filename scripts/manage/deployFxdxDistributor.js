const { deployContract } = require("../shared/helpers")

const network = (process.env.HARDHAT_NETWORK || 'mainnet')
const addresses = require("../../data/addresses")[network]

async function main() {
  const minVestingDuration = 30 * 24 * 60 * 60 // 1 month
  const maxVestingDuration = 5 * 365 * 24 * 60 * 60 // 5 years
  await deployContract("FxdxDistributor", [addresses.fxdx, minVestingDuration, maxVestingDuration])
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
