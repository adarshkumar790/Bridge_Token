const { expect, use } = require("chai")
const { solidity } = require("ethereum-waffle")
const { deployContract } = require("../shared/fixtures")
const { expandDecimals } = require("../shared/utilities")

use(solidity)

describe("FXDX", function () {
  const provider = waffle.provider
  const [wallet, lzEndpoint, user0, user1] = provider.getWallets()

  it("setMintAdmin", async () => {
    const fxdx = await deployContract("FXDX", [true, lzEndpoint.address]);

    await expect(fxdx.connect(user0).setMintAdmin(user0.address))
      .to.be.revertedWith("FXDX: caller is not the mintAdmin")

    await fxdx.transferOwnership(user0.address)

    await expect(fxdx.connect(user0).setMintAdmin(user0.address))
      .to.be.revertedWith("FXDX: caller is not the mintAdmin")

    expect(await fxdx.mintAdmin()).eq(wallet.address)
    await fxdx.connect(wallet).setMintAdmin(user0.address)
    expect(await fxdx.mintAdmin()).eq(user0.address)

    await expect(fxdx.connect(wallet).setMintAdmin(user1.address))
      .to.be.revertedWith("FXDX: caller is not the mintAdmin")

    await fxdx.connect(user0).setMintAdmin(user1.address)
      expect(await fxdx.mintAdmin()).eq(user1.address)
  });

  it("setMinter", async () => {
    const fxdx = await deployContract("FXDX", [true, lzEndpoint.address]);

    await expect(fxdx.connect(user0).setMinter(user0.address, true))
      .to.be.revertedWith("FXDX: caller is not the mintAdmin")

    await fxdx.setMintAdmin(user0.address)

    expect(await fxdx.isMinter(user0.address)).eq(false)
    await fxdx.connect(user0).setMinter(user0.address, true)
    expect(await fxdx.isMinter(user0.address)).eq(true)

    await fxdx.connect(user0).setMinter(user0.address, false)
    expect(await fxdx.isMinter(user0.address)).eq(false)
  })

  it("mint", async () => {
    const fxdxNotMintable = await deployContract("FXDX", [false, lzEndpoint.address]);
    const fxdxMintable = await deployContract("FXDX", [true, lzEndpoint.address]);

    await expect(fxdxMintable.connect(user0).mint(user0.address, 1000))
      .to.be.revertedWith("FXDX: caller is not a minter")

    await expect(fxdxNotMintable.connect(user0).mint(user0.address, 1000))
      .to.be.revertedWith("FXDX: caller is not a minter")

    await fxdxNotMintable.setMinter(user0.address, true)
    await fxdxMintable.setMinter(user0.address, true)

    await expect(fxdxNotMintable.connect(user0).mint(user0.address, 1000))
      .to.be.revertedWith("FXDX: mint is not allowed")

    expect(await fxdxMintable.balanceOf(user1.address)).eq(0)
    await fxdxMintable.connect(user0).mint(user1.address, 1000)
    expect(await fxdxMintable.balanceOf(user1.address)).eq(1000)
    expect(await fxdxMintable.totalSupply()).eq(1000)
    expect(await fxdxMintable.circulatingSupply()).eq(1000)
    expect(await fxdxMintable.userMintAmount()).eq(1000)

    await fxdxMintable.connect(user0).mint(user1.address, 500)
    expect(await fxdxMintable.balanceOf(user1.address)).eq(1500)
    expect(await fxdxMintable.totalSupply()).eq(1500)
    expect(await fxdxMintable.circulatingSupply()).eq(1500)
    expect(await fxdxMintable.userMintAmount()).eq(1500)

    await expect(fxdxMintable.connect(user0).mint(user1.address, expandDecimals(1, 27)))
      .to.be.revertedWith("FXDX: max user mint amount exceeds")
  })

  it("burn", async () => {
    const fxdxNotMintable = await deployContract("FXDX", [false, lzEndpoint.address]);
    const fxdxMintable = await deployContract("FXDX", [true, lzEndpoint.address]);

    await expect(fxdxMintable.connect(user0).burn(user0.address, 1000))
      .to.be.revertedWith("FXDX: caller is not a minter")

    await expect(fxdxNotMintable.connect(user0).burn(user0.address, 1000))
      .to.be.revertedWith("FXDX: caller is not a minter")

    await fxdxNotMintable.setMinter(user0.address, true)
    await fxdxMintable.setMinter(user0.address, true)

    await expect(fxdxNotMintable.connect(user0).burn(user0.address, 1000))
      .to.be.revertedWith("FXDX: burn is not allowed")

    await fxdxMintable.connect(user0).mint(user1.address, 1500)

    expect(await fxdxMintable.balanceOf(user1.address)).eq(1500)
    await fxdxMintable.connect(user0).burn(user1.address, 1000)
    expect(await fxdxMintable.balanceOf(user1.address)).eq(500)
    expect(await fxdxMintable.totalSupply()).eq(500)
    expect(await fxdxMintable.circulatingSupply()).eq(500)
    expect(await fxdxMintable.userMintAmount()).eq(500)

    await fxdxMintable.connect(user0).burn(user1.address, 500)
    expect(await fxdxMintable.balanceOf(user1.address)).eq(0)
    expect(await fxdxMintable.totalSupply()).eq(0)
    expect(await fxdxMintable.circulatingSupply()).eq(0)
    expect(await fxdxMintable.userMintAmount()).eq(0)

    await expect(fxdxMintable.connect(user0).burn(user1.address, 1000))
      .to.be.revertedWith("FXDX: burn amount exceeds userMintAmount")
  })
})
