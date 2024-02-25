const { contractAt, sendTxn } = require("../shared/helpers")

const network = (process.env.HARDHAT_NETWORK || 'mainnet')
const addresses = require("../../data/addresses")[network]

async function main() {
  const account = addresses.fxdxDistributorController
  const isActive = true

  const fxdxDistributor = await contractAt("FxdxDistributor", addresses.fxdxDistributor);

  await sendTxn(
    fxdxDistributor.setController(account, isActive),
    `fxdxDistributor.setController(${account}, ${isActive})`
  )
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
