const { contractAt, sendTxn } = require("../shared/helpers")

const network = (process.env.HARDHAT_NETWORK || 'mainnet')
const addresses = require("../../data/addresses")[network]

async function main() {
  const newOwner = addresses.owner

  const fxdx = await contractAt("FXDX", addresses.fxdx);
  // const fxdxConverter = await contractAt("FxdxConverter", addresses.fxdxConverter);
  // const fxdxDistributor = await contractAt("FxdxDistributor", addresses.fxdxDistributor);

  await sendTxn(
    fxdx.transferOwnership(newOwner),
    `fxdx.transferOwnership(${newOwner})`
  )

  await sendTxn(
    fxdx.setMintAdmin(newOwner),
    `fxdx.setMintAdmin(${newOwner})`
  )

  // await sendTxn(
  //   fxdxConverter.transferOwnership(newOwner),
  //   `fxdxConverter.transferOwnership(${newOwner})`
  // )

  // await sendTxn(
  //   fxdxDistributor.transferOwnership(newOwner),
  //   `fxdxDistributor.transferOwnership(${newOwner})`
  // )
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
