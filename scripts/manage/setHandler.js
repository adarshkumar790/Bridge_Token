const { contractAt, sendTxn } = require("../shared/helpers")

const network = (process.env.HARDHAT_NETWORK || 'mainnet')
const addresses = require("../../data/addresses")[network]

async function main() {
  const account = addresses.fxdxConverterHandler
  const isActive = true

  const fxdxConverter = await contractAt("FxdxConverter", addresses.fxdxConverter);

  await sendTxn(
    fxdxConverter.setHandler(account, isActive),
    `fxdxConverter.setHandler(${account}, ${isActive})`
  )
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
