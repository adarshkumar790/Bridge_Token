const { contractAt, sendTxn } = require("../shared/helpers")

const network = (process.env.HARDHAT_NETWORK || 'mainnet')
const layerZeroData = require("../../data/layer-zero-data")
const addresses = require("../../data/addresses")
const { expandDecimals } = require("../../test/shared/utilities")
const { ethers } = require("hardhat")

async function main() {
  const amount = expandDecimals(1, 27);
  const remoteNetwork = "mumbai";
  const fromAccount = addresses[network].owner;
  const toAccount = addresses[remoteNetwork].owner;

  const dstChainId = layerZeroData[remoteNetwork].chainId;

  const fxdx = await contractAt("FXDX", addresses[network].fxdx);

  const estimatedFee = await fxdx.estimateSendFee(
    dstChainId,
    toAccount,
    amount,
    false,
    "0x"
  )

  console.log("-> estimatedFee:", estimatedFee[0].toString())

  // address _from, uint16 _dstChainId, bytes calldata _toAddress, uint _amount, address payable _refundAddress, address _zroPaymentAddress, bytes calldata _adapterParams
  await sendTxn(
    fxdx.sendFrom(
      fromAccount,
      dstChainId,
      toAccount,
      amount,
      fromAccount,
      ethers.constants.AddressZero,
      "0x",
      { value: estimatedFee[0] }
    ),
    `fxdx.sendFrom(${fromAccount}, ${dstChainId}, ${toAccount}, ${amount})`
  )
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
