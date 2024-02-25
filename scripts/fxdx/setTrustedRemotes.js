const { contractAt, sendTxn } = require("../shared/helpers")

const network = (process.env.HARDHAT_NETWORK || 'mainnet')
const layerZeroData = require("../../data/layer-zero-data")
const addresses = require("../../data/addresses")

const getRemoteData = () => {
  let networks = [];
  if (network === "mainnet") {
    // networks = ["optimism", "base"]
    networks = ["base"]
  } else if (network === "optimism") {
    networks = ["mainnet", "base"]
  } else if (network === "base") {
    // networks = ["mainnet", "optimism"]
    networks = ["mainnet"]
  } else if (network === "goerli") {
    networks = ["optimismGoerli"]
  } else if (network === "optimismGoerli") {
    networks = ["goerli"]
  }
  else if (network === "arbitrumSepolia") {
    networks = ["mumbai"]
  }
  else if (network === "mumbai") {
    networks = ["arbitrumSepolia"]
  }
  

  return networks.map(item => ({
    chainId: layerZeroData[item].chainId,
    remoteAddress: addresses[item].fxdx,
  }));
}

async function main() {
  const remoteData = getRemoteData()
  const fxdx = await contractAt("FXDX", addresses[network].fxdx);

  for (let item of remoteData) {
    await sendTxn(
      fxdx.setTrustedRemoteAddress(item.chainId, item.remoteAddress),
      `fxdx.setTrustedRemoteAddress(${item.chainId}, ${item.remoteAddress})`
    )
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
