const { formatAmount } = require("../../test/shared/utilities")
const { contractAt } = require("../shared/helpers")

const network = (process.env.HARDHAT_NETWORK || 'mainnet')
const addresses = require("../../data/addresses")[network]

async function main() {
  const account = addresses.owner
  const fxdx = await contractAt("FXDX", addresses.fxdx);

  const balance = await fxdx.balanceOf(account);
  console.log("-> balance:", formatAmount(balance, 18, 18, true));

  const totalSupply = await fxdx.totalSupply();
  console.log("-> totalSupply:", formatAmount(totalSupply, 18, 18, true));

  const circulatingSupply = await fxdx.circulatingSupply();
  console.log("-> circulatingSupply:", formatAmount(circulatingSupply, 18, 18, true));

  const userMintAmount = await fxdx.userMintAmount();
  console.log("-> userMintAmount:", formatAmount(userMintAmount, 18, 18, true));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
