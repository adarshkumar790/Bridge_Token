const { ethers } = require("hardhat");

async function main() {
  const message = "[Etherscan.io 03/10/2023 05:19:36] I, hereby verify that I am the owner/creator of the address [0x30b593f8c3ab37615359B4E0E6df2e06d55bB55d]";

  const [owner] = await ethers.getSigners();

  const signedMesssage = await owner.signMessage(message);

  console.log("-> signedMessage:", signedMesssage);

  const singerAddress = ethers.utils.verifyMessage(message, signedMesssage);

  console.log("-> signerAddress:", singerAddress);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
