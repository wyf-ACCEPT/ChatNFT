import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"
import * as dotenv from "dotenv"
dotenv.config()


const CHAIN_ID = ethers.toBigInt(process.env.CHAIN_ID!)
const SALT = ethers.toBigInt(process.env.SALT!)


describe("test the functions related to assets management", function () {

  async function deployAssets() {
    const [owner, carol, david] = await ethers.getSigners()

    const MasterToken = await ethers.deployContract('MasterToken')
    const FunctionBot = await ethers.deployContract('FunctionBot')

    const AssetsFactory = await ethers.getContractFactory('Assets')
    const Assets = await AssetsFactory.deploy(
      await MasterToken.getAddress(), await FunctionBot.getAddress()
    )

    const amount = ethers.parseEther('400')
    await MasterToken.mint(carol.address, amount)
    await MasterToken.mint(david.address, amount)
    await MasterToken.connect(carol).approve(await Assets.getAddress(), amount)
    await MasterToken.connect(david).approve(await Assets.getAddress(), amount)

    return { MasterToken, FunctionBot, Assets, owner, carol, david }
  }


  it("Assets functions test: part `Share`", async function () {
    const { MasterToken, Assets, carol, david } = await loadFixture(deployAssets)

    await Assets.connect(carol).purchase()  // 400 - 1 = 399
    await Assets.connect(carol).purchase()  // 399 - 2 = 397
    expect(await MasterToken.balanceOf(carol.address)).to.equal(ethers.parseEther('397'))

    await Assets.connect(david).purchase()  // 400 - 3 = 397
    await Assets.connect(david).purchase()  // 397 - 4 = 393
    expect(await MasterToken.balanceOf(david.address)).to.equal(ethers.parseEther('393'))

    await Assets.connect(carol).sell()      // 397 + 4 * 95% = 400.8
    expect(await MasterToken.balanceOf(carol.address)).to.equal(ethers.parseEther('400.8'))

    await Assets.connect(david).sell()      // 393 + 3 * 95% = 395.85
    expect(await MasterToken.balanceOf(david.address)).to.equal(ethers.parseEther('395.85'))

    await Assets.connect(carol).sell()      // 400.8 + 2 * 95% = 402.7
    expect(await MasterToken.balanceOf(carol.address)).to.equal(ethers.parseEther('402.7'))

    await expect(Assets.connect(carol).sell())
      .to.be.revertedWith('You have no Share Tokens to sell')
  })


  it("Assets function test: part `Energy`", async function () {

  })
})