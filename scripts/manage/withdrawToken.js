const { expandDecimals } = require("../../test/shared/utilities");
const { contractAt, sendTxn } = require("../shared/helpers")

const network = (process.env.HARDHAT_NETWORK || 'mainnet')
const addresses = require("../../data/addresses")[network]

async function main() {
  const fxdxDistributor = await contractAt("FxdxDistributor", addresses.fxdxDistributor);

  const toAccount = addresses.owner
  const amount = expandDecimals(373646, 18)

  await sendTxn(
    fxdxDistributor.withdrawToken(addresses.fxdx, toAccount, amount),
    `fxdxDistributor.withdrawToken(${addresses.fxdx}, ${toAccount}, ${amount})`
  )
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
