const { contractAt, sendTxn } = require("../shared/helpers")

const network = (process.env.HARDHAT_NETWORK || 'mainnet')
const addresses = require("../../data/addresses")[network]

async function main() {
  const account = addresses.fxdxDistributorClaimHandler
  const isActive = true

  const fxdxDistributor = await contractAt("FxdxDistributor", addresses.fxdxDistributor);

  await sendTxn(
    fxdxDistributor.setClaimHandler(account, isActive),
    `fxdxDistributor.setClaimHandler(${account}, ${isActive})`
  )
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
