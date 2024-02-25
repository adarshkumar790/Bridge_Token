const { expandDecimals } = require("../../test/shared/utilities");
const { contractAt, sendTxn } = require("../shared/helpers")

const network = (process.env.HARDHAT_NETWORK || 'mainnet')
const addresses = require("../../data/addresses")[network]

async function main() {
  const fxdx = await contractAt("FXDX", addresses.fxdx);
  const toAccount = addresses.fxdxDistributor;
  const amount = expandDecimals(999000000, 18);

  await sendTxn(
    fxdx.transfer(toAccount, amount),
    `fxdx.transfer(${toAccount}, ${amount})`
  )
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
