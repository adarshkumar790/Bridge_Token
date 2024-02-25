const { contractAt, sendTxn } = require("../shared/helpers")

const network = (process.env.HARDHAT_NETWORK || 'mainnet')
const addresses = require("../../data/addresses")[network]

async function main() {
  if (network !== "arbitrumSepolia" && network !== "mainnet") {
    console.error("Mint / Burn is not supported on", network)
    return
  }

  const account = addresses.owner
  const isActive = true

  const fxdx = await contractAt("FXDX", addresses.fxdx);

  await sendTxn(
    fxdx.setMinter(account, isActive),
    `fxdx.setMinter(${account}, ${isActive})`
  )
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
