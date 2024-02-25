const { ethers } = require("hardhat")
const { expandDecimals } = require("../../test/shared/utilities")
const { contractAt, sendTxn } = require("../shared/helpers")

const network = (process.env.HARDHAT_NETWORK || 'mainnet')
const addresses = require("../../data/addresses")[network]

async function main() {
  if (network !== "arbitrumSepolia" && network !== "mainnet") {
    console.error("Mint is not supported on", network)
    return
  }

  const amount = expandDecimals(1, 27)
  const receiver = (await ethers.getSigners())[0]

  const fxdx = await contractAt("FXDX", addresses.fxdx);

  await sendTxn(
    fxdx.mint(receiver.address, amount),
    `fxdx.mint(${receiver.address}, ${amount})`
  )
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
