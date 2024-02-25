const { expect, use } = require("chai")
const { solidity } = require("ethereum-waffle")
const { deployContract } = require("../shared/fixtures")

use(solidity)

describe("FxdxConverter", function () {
  const provider = waffle.provider
  const [wallet, lzEndpoint, user0, user1, user2] = provider.getWallets()

  let fxdxV1
  let fxdxV2
  let fxdxConverter

  beforeEach(async () => {
    fxdxV1 = await deployContract("MintableBaseToken", ["FXDX", "FXDX", 0])
    fxdxV2 = await deployContract("FXDX", [true, lzEndpoint.address])
    fxdxConverter = await deployContract("FxdxConverter", [fxdxV1.address, fxdxV2.address])

    fxdxV1.setMinter(wallet.address, true);
    fxdxV2.setMinter(wallet.address, true);
  })

  it("setHandler", async () => {
    await expect(fxdxConverter.connect(user0).setHandler(user1.address, true))
      .to.be.revertedWith("Ownable: caller is not the owner")

    await fxdxConverter.transferOwnership(user0.address)

    expect(await fxdxConverter.isHandler(user1.address)).eq(false)
    await fxdxConverter.connect(user0).setHandler(user1.address, true)
    expect(await fxdxConverter.isHandler(user1.address)).eq(true)

    await fxdxConverter.connect(user0).setHandler(user1.address, false)
    expect(await fxdxConverter.isHandler(user1.address)).eq(false)
  })

  it("withdrawToken", async () => {
    await fxdxV1.mint(fxdxConverter.address, 1000)

    await expect(fxdxConverter.connect(user0).withdrawToken(fxdxV1.address, user1.address, 1000))
      .to.be.revertedWith("Ownable: caller is not the owner")

    await fxdxConverter.transferOwnership(user0.address)

    expect(await fxdxV1.balanceOf(user1.address)).eq(0)
    await fxdxConverter.connect(user0).withdrawToken(fxdxV1.address, user1.address, 1000)
    expect(await fxdxV1.balanceOf(user1.address)).eq(1000)
  })

  it("convert", async () => {
    await expect(fxdxConverter.connect(user0).convert(1000))
      .to.be.revertedWith("MintableBaseToken: forbidden")

    await fxdxV1.setMinter(fxdxConverter.address, true);

    await expect(fxdxConverter.connect(user0).convert(1000))
      .to.be.revertedWith("BaseToken: burn amount exceeds balance")

    await fxdxV1.mint(user0.address, 2000)

    await expect(fxdxConverter.connect(user0).convert(1000))
      .to.be.revertedWith("ERC20: transfer amount exceeds balance")

    await fxdxV2.mint(fxdxConverter.address, 2000)

    expect(await fxdxV1.balanceOf(user0.address)).eq(2000)
    expect(await fxdxV2.balanceOf(fxdxConverter.address)).eq(2000)
    expect(await fxdxV2.balanceOf(user0.address)).eq(0)
    await fxdxConverter.connect(user0).convert(1000)
    expect(await fxdxV1.balanceOf(user0.address)).eq(1000)
    expect(await fxdxV2.balanceOf(fxdxConverter.address)).eq(1000)
    expect(await fxdxV2.balanceOf(user0.address)).eq(1000)
  })

  it("convertTo", async () => {
    await expect(fxdxConverter.connect(user0).convertTo(1000, user1.address))
      .to.be.revertedWith("MintableBaseToken: forbidden")

    await fxdxV1.setMinter(fxdxConverter.address, true);

    await expect(fxdxConverter.connect(user0).convertTo(1000, user1.address))
      .to.be.revertedWith("BaseToken: burn amount exceeds balance")

    await fxdxV1.mint(user0.address, 2000)

    await expect(fxdxConverter.connect(user0).convertTo(1000, user1.address))
      .to.be.revertedWith("ERC20: transfer amount exceeds balance")

    await fxdxV2.mint(fxdxConverter.address, 2000)

    expect(await fxdxV1.balanceOf(user0.address)).eq(2000)
    expect(await fxdxV2.balanceOf(fxdxConverter.address)).eq(2000)
    expect(await fxdxV2.balanceOf(user0.address)).eq(0)
    expect(await fxdxV2.balanceOf(user1.address)).eq(0)
    await fxdxConverter.connect(user0).convertTo(1000, user1.address)
    expect(await fxdxV1.balanceOf(user0.address)).eq(1000)
    expect(await fxdxV2.balanceOf(fxdxConverter.address)).eq(1000)
    expect(await fxdxV2.balanceOf(user0.address)).eq(0)
    expect(await fxdxV2.balanceOf(user1.address)).eq(1000)
  })

  it("convertFrom", async () => {
    await expect(fxdxConverter.connect(user0).convertFrom(user1.address, 1000, user2.address))
      .to.be.revertedWith("FxdxConverter: forbidden")

    await fxdxConverter.setHandler(user0.address, true)

    await expect(fxdxConverter.connect(user0).convertFrom(user1.address, 1000, user2.address))
      .to.be.revertedWith("BaseToken: transfer amount exceeds allowance")

    await fxdxV1.connect(user1).approve(fxdxConverter.address, 1000)

    await expect(fxdxConverter.connect(user0).convertFrom(user1.address, 1000, user2.address))
      .to.be.revertedWith("BaseToken: transfer amount exceeds balance")

    await fxdxV1.mint(user1.address, 2000)

    await expect(fxdxConverter.connect(user0).convertFrom(user1.address, 1000, user2.address))
      .to.be.revertedWith("MintableBaseToken: forbidden")

    await fxdxV1.setMinter(fxdxConverter.address, true);

    await expect(fxdxConverter.connect(user0).convertFrom(user1.address, 1000, user2.address))
      .to.be.revertedWith("ERC20: transfer amount exceeds balance")

    await fxdxV2.mint(fxdxConverter.address, 2000)

    expect(await fxdxV1.balanceOf(user1.address)).eq(2000)
    expect(await fxdxV2.balanceOf(fxdxConverter.address)).eq(2000)
    expect(await fxdxV2.balanceOf(user1.address)).eq(0)
    expect(await fxdxV2.balanceOf(user2.address)).eq(0)
    await fxdxConverter.connect(user0).convertFrom(user1.address, 1000, user2.address)
    expect(await fxdxV1.balanceOf(user1.address)).eq(1000)
    expect(await fxdxV2.balanceOf(fxdxConverter.address)).eq(1000)
    expect(await fxdxV2.balanceOf(user1.address)).eq(0)
    expect(await fxdxV2.balanceOf(user2.address)).eq(1000)
  })
})
