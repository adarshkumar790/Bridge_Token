const { expect, use } = require("chai")
const { solidity } = require("ethereum-waffle")
const { deployContract } = require("../shared/fixtures")
const { increaseTime, mineBlock, getBlockTime } = require("../shared/utilities")

use(solidity)

describe("FxdxDistributor", function () {
  const provider = waffle.provider
  const [wallet, lzEndpoint, user0, user1, user2, user3] = provider.getWallets()

  let fxdx
  let fxdxDistributor

  beforeEach(async () => {
    fxdx = await deployContract("FXDX", [true, lzEndpoint.address])
    fxdxDistributor = await deployContract("FxdxDistributor", [fxdx.address, 1000, 100000])

    fxdx.setMinter(wallet.address, true);
  })

  it("inits", async () => {
    expect(await fxdxDistributor.fxdx()).eq(fxdx.address)
    expect(await fxdxDistributor.minVestingDuration()).eq(1000)
    expect(await fxdxDistributor.maxVestingDuration()).eq(100000)
  })

  it("withdrawToken", async () => {
    await fxdx.mint(fxdxDistributor.address, 1000)

    await expect(fxdxDistributor.connect(user0).withdrawToken(fxdx.address, user1.address, 1000))
      .to.be.revertedWith("Ownable: caller is not the owner")

    await fxdxDistributor.transferOwnership(user0.address)

    expect(await fxdx.balanceOf(user1.address)).eq(0)
    await fxdxDistributor.connect(user0).withdrawToken(fxdx.address, user1.address, 1000)
    expect(await fxdx.balanceOf(user1.address)).eq(1000)
  })

  it("setController", async () => {
    await expect(fxdxDistributor.connect(user0).setController(user1.address, true))
      .to.be.revertedWith("Ownable: caller is not the owner")

    await fxdxDistributor.transferOwnership(user0.address)

    expect(await fxdxDistributor.isController(user1.address)).eq(false)
    await fxdxDistributor.connect(user0).setController(user1.address, true)
    expect(await fxdxDistributor.isController(user1.address)).eq(true)

    await fxdxDistributor.connect(user0).setController(user1.address, false)
    expect(await fxdxDistributor.isController(user1.address)).eq(false)
  })

  it("setClaimHandler", async () => {
    await expect(fxdxDistributor.connect(user0).setClaimHandler(user1.address, true))
      .to.be.revertedWith("Ownable: caller is not the owner")

    await fxdxDistributor.transferOwnership(user0.address)

    expect(await fxdxDistributor.isClaimHandler(user1.address)).eq(false)
    await fxdxDistributor.connect(user0).setClaimHandler(user1.address, true)
    expect(await fxdxDistributor.isClaimHandler(user1.address)).eq(true)

    await fxdxDistributor.connect(user0).setClaimHandler(user1.address, false)
    expect(await fxdxDistributor.isClaimHandler(user1.address)).eq(false)
  })

  it("setVestingDurationBounds", async () => {
    await expect(fxdxDistributor.connect(user0).setVestingDurationBounds(10, 1000))
      .to.be.revertedWith("Ownable: caller is not the owner")

    await fxdxDistributor.transferOwnership(user0.address)

    await expect(fxdxDistributor.connect(user0).setVestingDurationBounds(1000, 10))
      .to.be.revertedWith("FxdxDistributor: invalid vestingDuration bounds")

    expect(await fxdxDistributor.minVestingDuration()).eq(1000)
    expect(await fxdxDistributor.maxVestingDuration()).eq(100000)
    await fxdxDistributor.connect(user0).setVestingDurationBounds(10, 1000)
    expect(await fxdxDistributor.minVestingDuration()).eq(10)
    expect(await fxdxDistributor.maxVestingDuration()).eq(1000)
  })

  it("createVesting, claim, cancelVesting", async () => {
    await expect(fxdxDistributor.connect(user0).createVesting(user1.address, 0, 10000))
      .to.be.revertedWith("FxdxDistributor: forbidden")

    await fxdxDistributor.setController(user0.address, true)

    await expect(fxdxDistributor.connect(user0).createVesting(user1.address, 0, 10000))
      .to.be.revertedWith("FxdxDistributor: invalid _amount")

    await expect(fxdxDistributor.connect(user0).createVesting(user1.address, 1000, 100))
      .to.be.revertedWith("FxdxDistributor: invalid _vestingDuration")

    await expect(fxdxDistributor.connect(user0).createVesting(user1.address, 1000, 1000000))
      .to.be.revertedWith("FxdxDistributor: invalid _vestingDuration")

    expect(await fxdxDistributor.vestingDurations(user1.address)).eq(0)
    expect(await fxdxDistributor.vestingAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.getVestedAmount(user1.address)).eq(0)
    expect(await fxdxDistributor.cumulativeClaimAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.claimedAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.claimable(user1.address)).eq(0)
    expect(await fxdxDistributor.lastVestingTimes(user1.address)).eq(0)

    await fxdxDistributor.connect(user0).createVesting(user1.address, 1000, 10000)

    let blockTime = await getBlockTime(provider)

    expect(await fxdxDistributor.vestingDurations(user1.address)).eq(10000)
    expect(await fxdxDistributor.vestingAmounts(user1.address)).eq(1000)
    expect(await fxdxDistributor.getVestedAmount(user1.address)).eq(1000)
    expect(await fxdxDistributor.cumulativeClaimAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.claimedAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.claimable(user1.address)).eq(0)
    expect(await fxdxDistributor.lastVestingTimes(user1.address)).eq(blockTime)

    await increaseTime(provider, 1000)
    await mineBlock(provider)

    expect(await fxdx.balanceOf(user1.address)).eq(0)
    expect(await fxdxDistributor.vestingAmounts(user1.address)).eq(1000)
    expect(await fxdxDistributor.getVestedAmount(user1.address)).eq(1000)
    expect(await fxdxDistributor.cumulativeClaimAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.claimedAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.claimable(user1.address)).eq(100) // 1000 * 1000 / 10000
    expect(await fxdxDistributor.lastVestingTimes(user1.address)).eq(blockTime)

    await expect(fxdxDistributor.connect(user1).claim())
      .to.be.revertedWith("ERC20: transfer amount exceeds balance")

    await fxdx.mint(fxdxDistributor.address, 2000)

    await fxdxDistributor.connect(user1).claim()
    blockTime = await getBlockTime(provider)

    expect(await fxdx.balanceOf(user1.address)).eq(100)

    let fxdxAmount = await fxdx.balanceOf(user1.address)
    expect(await fxdxDistributor.vestingAmounts(user1.address)).eq(1000 - fxdxAmount)

    expect(await fxdxDistributor.getVestedAmount(user1.address)).eq(1000)
    expect(await fxdxDistributor.cumulativeClaimAmounts(user1.address)).eq(fxdxAmount)
    expect(await fxdxDistributor.claimedAmounts(user1.address)).eq(fxdxAmount)
    expect(await fxdxDistributor.claimable(user1.address)).eq(0)
    expect(await fxdxDistributor.lastVestingTimes(user1.address)).eq(blockTime)

    await increaseTime(provider, 2000)
    await mineBlock(provider)

    expect(await fxdxDistributor.cumulativeClaimAmounts(user1.address)).eq(fxdxAmount)
    expect(await fxdxDistributor.claimedAmounts(user1.address)).eq(fxdxAmount)
    expect(await fxdxDistributor.claimable(user1.address)).eq(200) // 1000 * 2000 / 10000

    await increaseTime(provider, 5000)
    await mineBlock(provider)

    expect(await fxdxDistributor.cumulativeClaimAmounts(user1.address)).eq(fxdxAmount)
    expect(await fxdxDistributor.claimedAmounts(user1.address)).eq(fxdxAmount)
    expect(await fxdxDistributor.claimable(user1.address)).eq(700) // 1000 * (2000 + 5000) / 10000 => 700

    await fxdxDistributor.connect(user1).claim()
    blockTime = await getBlockTime(provider)

    expect(await fxdx.balanceOf(user1.address)).eq(800)

    fxdxAmount = await fxdx.balanceOf(user1.address)
    expect(await fxdxDistributor.vestingAmounts(user1.address)).eq(1000 - fxdxAmount)

    expect(await fxdxDistributor.getVestedAmount(user1.address)).eq(1000)
    expect(await fxdxDistributor.cumulativeClaimAmounts(user1.address)).eq(fxdxAmount)
    expect(await fxdxDistributor.claimedAmounts(user1.address)).eq(fxdxAmount)
    expect(await fxdxDistributor.claimable(user1.address)).eq(0)
    expect(await fxdxDistributor.lastVestingTimes(user1.address)).eq(blockTime)

    await increaseTime(provider, 1000)
    await mineBlock(provider)

    // vesting rate should be the same even after claiming
    expect(await fxdxDistributor.claimable(user1.address)).eq(100) // 1000 * 1000 / 10000 => 100

    await fxdxDistributor.connect(user0).createVesting(user1.address, 2000, 20000)

    await increaseTime(provider, 1000)
    await mineBlock(provider)

    expect(await fxdxDistributor.claimable(user1.address)).eq(250) // 100 + 3000 * 1000 / 20000 => 250

    expect(await fxdx.balanceOf(user1.address)).eq(fxdxAmount)

    await fxdxDistributor.connect(user0).cancelVesting(user1.address)

    expect(await fxdx.balanceOf(user1.address)).eq(1050)

    expect(await fxdxDistributor.vestingDurations(user1.address)).eq(20000)
    expect(await fxdxDistributor.vestingAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.getVestedAmount(user1.address)).eq(0)
    expect(await fxdxDistributor.cumulativeClaimAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.claimedAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.claimable(user1.address)).eq(0)
    expect(await fxdxDistributor.lastVestingTimes(user1.address)).eq(0)

    await fxdxDistributor.connect(user0).createVesting(user1.address, 1000, 10000)
    blockTime = await getBlockTime(provider)

    await increaseTime(provider, 1000)
    await mineBlock(provider)

    expect(await fxdxDistributor.vestingAmounts(user1.address)).eq(1000)
    expect(await fxdxDistributor.getVestedAmount(user1.address)).eq(1000)
    expect(await fxdxDistributor.cumulativeClaimAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.claimedAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.claimable(user1.address)).eq(100) // 1000 * 1000 / 10000 => 100
    expect(await fxdxDistributor.lastVestingTimes(user1.address)).eq(blockTime)

    await fxdxDistributor.connect(user1).claim()
  })

  it("increaseVestingAmount, decreaseVestingAmount, setVestiongDuration, claimForAccount", async () => {
    await expect(fxdxDistributor.connect(user0).increaseVestingAmount(user1.address, 1000))
      .to.be.revertedWith("FxdxDistributor: forbidden")

    await expect(fxdxDistributor.connect(user0).decreaseVestingAmount(user1.address, 1000))
      .to.be.revertedWith("FxdxDistributor: forbidden")

    await expect(fxdxDistributor.connect(user0).setVestingDuration(user1.address, 10000))
      .to.be.revertedWith("FxdxDistributor: forbidden")

    await fxdxDistributor.setController(user0.address, true)

    await expect(fxdxDistributor.connect(user0).increaseVestingAmount(user1.address, 0))
      .to.be.revertedWith("FxdxDistributor: invalid _amount")

    await expect(fxdxDistributor.connect(user0).decreaseVestingAmount(user1.address, 0))
      .to.be.revertedWith("FxdxDistributor: invalid _amount")

    await expect(fxdxDistributor.connect(user0).setVestingDuration(user1.address, 100))
      .to.be.revertedWith("FxdxDistributor: invalid _vestingDuration")

    await expect(fxdxDistributor.connect(user0).setVestingDuration(user1.address, 1000000))
      .to.be.revertedWith("FxdxDistributor: invalid _vestingDuration")

    expect(await fxdxDistributor.vestingDurations(user1.address)).eq(0)
    expect(await fxdxDistributor.vestingAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.getVestedAmount(user1.address)).eq(0)
    expect(await fxdxDistributor.cumulativeClaimAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.claimedAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.claimable(user1.address)).eq(0)
    expect(await fxdxDistributor.lastVestingTimes(user1.address)).eq(0)

    await fxdxDistributor.connect(user0).increaseVestingAmount(user1.address, 1000)

    let blockTime = await getBlockTime(provider)

    expect(await fxdxDistributor.vestingDurations(user1.address)).eq(0)
    expect(await fxdxDistributor.vestingAmounts(user1.address)).eq(1000)
    expect(await fxdxDistributor.getVestedAmount(user1.address)).eq(1000)
    expect(await fxdxDistributor.cumulativeClaimAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.claimedAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.claimable(user1.address)).eq(0)
    expect(await fxdxDistributor.lastVestingTimes(user1.address)).eq(blockTime)

    await increaseTime(provider, 1000)
    await mineBlock(provider)

    expect(await fxdx.balanceOf(user1.address)).eq(0)
    expect(await fxdxDistributor.vestingAmounts(user1.address)).eq(1000)
    expect(await fxdxDistributor.getVestedAmount(user1.address)).eq(1000)
    expect(await fxdxDistributor.cumulativeClaimAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.claimedAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.claimable(user1.address)).eq(0) // 1000 * 1000 / 10000
    expect(await fxdxDistributor.lastVestingTimes(user1.address)).eq(blockTime)

    await fxdxDistributor.connect(user0).setVestingDuration(user1.address, 10000)

    blockTime = await getBlockTime(provider)

    await increaseTime(provider, 1000)
    await mineBlock(provider)

    expect(await fxdx.balanceOf(user1.address)).eq(0)
    expect(await fxdxDistributor.vestingAmounts(user1.address)).eq(1000)
    expect(await fxdxDistributor.getVestedAmount(user1.address)).eq(1000)
    expect(await fxdxDistributor.cumulativeClaimAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.claimedAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.claimable(user1.address)).eq(100) // 1000 * 1000 / 10000
    expect(await fxdxDistributor.lastVestingTimes(user1.address)).eq(blockTime)

    await expect(fxdxDistributor.connect(user2).claimForAccount(user1.address, user3.address))
      .to.be.revertedWith("FxdxDistributor: forbidden")

    await fxdxDistributor.setClaimHandler(user2.address, true)

    await expect(fxdxDistributor.connect(user2).claimForAccount(user1.address, user3.address))
      .to.be.revertedWith("ERC20: transfer amount exceeds balance")

    await fxdx.mint(fxdxDistributor.address, 2000)

    await fxdxDistributor.connect(user2).claimForAccount(user1.address, user3.address)
    blockTime = await getBlockTime(provider)

    expect(await fxdx.balanceOf(user3.address)).eq(100)

    let fxdxAmount = await fxdx.balanceOf(user3.address)
    expect(await fxdxDistributor.vestingAmounts(user1.address)).eq(1000 - fxdxAmount)

    expect(await fxdxDistributor.getVestedAmount(user1.address)).eq(1000)
    expect(await fxdxDistributor.cumulativeClaimAmounts(user1.address)).eq(fxdxAmount)
    expect(await fxdxDistributor.claimedAmounts(user1.address)).eq(fxdxAmount)
    expect(await fxdxDistributor.claimable(user1.address)).eq(0)
    expect(await fxdxDistributor.lastVestingTimes(user1.address)).eq(blockTime)

    await fxdxDistributor.connect(user0).setVestingDuration(user1.address, 20000)
    blockTime = await getBlockTime(provider)

    await increaseTime(provider, 3000)
    await mineBlock(provider)

    expect(await fxdxDistributor.cumulativeClaimAmounts(user1.address)).eq(fxdxAmount)
    expect(await fxdxDistributor.claimedAmounts(user1.address)).eq(fxdxAmount)
    expect(await fxdxDistributor.claimable(user1.address)).eq(150) // 1000 * 3000 / 20000

    await increaseTime(provider, 5000)
    await mineBlock(provider)

    expect(await fxdxDistributor.cumulativeClaimAmounts(user1.address)).eq(fxdxAmount)
    expect(await fxdxDistributor.claimedAmounts(user1.address)).eq(fxdxAmount)
    expect(await fxdxDistributor.claimable(user1.address)).eq(400) // 1000 * (3000 + 5000) / 20000 => 400

    await fxdxDistributor.connect(user2).claimForAccount(user1.address, user3.address)
    blockTime = await getBlockTime(provider)

    expect(await fxdx.balanceOf(user3.address)).eq(500)

    fxdxAmount = await fxdx.balanceOf(user3.address)
    expect(await fxdxDistributor.vestingAmounts(user1.address)).eq(1000 - fxdxAmount)

    expect(await fxdxDistributor.vestingDurations(user1.address)).eq(20000)
    expect(await fxdxDistributor.getVestedAmount(user1.address)).eq(1000)
    expect(await fxdxDistributor.cumulativeClaimAmounts(user1.address)).eq(fxdxAmount)
    expect(await fxdxDistributor.claimedAmounts(user1.address)).eq(fxdxAmount)
    expect(await fxdxDistributor.claimable(user1.address)).eq(0)
    expect(await fxdxDistributor.lastVestingTimes(user1.address)).eq(blockTime)

    await fxdxDistributor.connect(user0).decreaseVestingAmount(user1.address, 200)
    blockTime = await getBlockTime(provider)

    await increaseTime(provider, 1000)
    await mineBlock(provider)

    expect(await fxdxDistributor.claimable(user1.address)).eq(40) // 800 * 1000 / 20000 => 40

    expect(await fxdx.balanceOf(user3.address)).eq(fxdxAmount)

    await fxdxDistributor.connect(user0).decreaseVestingAmount(user1.address, 500)
    blockTime = await getBlockTime(provider)

    await increaseTime(provider, 1000)
    await mineBlock(provider)

    expect(await fxdxDistributor.vestingAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.getVestedAmount(user1.address)).eq(540)
    expect(await fxdxDistributor.cumulativeClaimAmounts(user1.address)).eq(540)
    expect(await fxdxDistributor.claimedAmounts(user1.address)).eq(500)
    expect(await fxdxDistributor.claimable(user1.address)).eq(40)
    expect(await fxdxDistributor.lastVestingTimes(user1.address)).eq(blockTime)

    await fxdxDistributor.connect(user2).claimForAccount(user1.address, user3.address)
    blockTime = await getBlockTime(provider)

    expect(await fxdx.balanceOf(user3.address)).eq(540)

    expect(await fxdxDistributor.vestingAmounts(user1.address)).eq(0)
    expect(await fxdxDistributor.getVestedAmount(user1.address)).eq(540)
    expect(await fxdxDistributor.cumulativeClaimAmounts(user1.address)).eq(540)
    expect(await fxdxDistributor.claimedAmounts(user1.address)).eq(540)
    expect(await fxdxDistributor.claimable(user1.address)).eq(0)
    expect(await fxdxDistributor.lastVestingTimes(user1.address)).eq(blockTime)
  })
})
