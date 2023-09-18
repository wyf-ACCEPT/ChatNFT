import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"
import * as dotenv from "dotenv"
dotenv.config()

const CHAIN_ID = ethers.toBigInt(process.env.CHAIN_ID!)
const SALT = ethers.toBigInt(process.env.SALT!)

describe("ERC6551 basic functions", function () {
  async function deployERC6551() {
    const [owner, alice, bob] = await ethers.getSigners()

    const MasterBotNFT = await ethers.deployContract("MasterBotNFT")
    await MasterBotNFT.safeMint(alice.address)
    await MasterBotNFT.safeMint(bob.address)

    const MasterBotAccountImplementation = await ethers.deployContract("MasterBotTokenBoundAccount")
    const MasterBotRegistry = await ethers.deployContract("ERC6551Registry")

    return { MasterBotNFT, MasterBotAccountImplementation, MasterBotRegistry }
  }


  it("MasterBot NFT should be deployed successfully", async function () {
    const [owner, alice, bob] = await ethers.getSigners()
    const MasterBotNFT = await ethers.deployContract("MasterBotNFT")

    await MasterBotNFT.safeMint(alice.address)
    await MasterBotNFT.safeMint(bob.address)
    expect(await MasterBotNFT.balanceOf(alice.address)).to.equal(1)
    expect(await MasterBotNFT.ownerOf(1)).to.equal(bob.address)
  })

  
  it("MasterBot TBA's view functions should be executed successfully", async () => {
    const { MasterBotNFT, MasterBotAccountImplementation, MasterBotRegistry } = await loadFixture(deployERC6551)

    const tokenID = 0

    const MasterBotTBA_0_address = await MasterBotRegistry.account(
      await MasterBotAccountImplementation.getAddress(),
      CHAIN_ID,
      await MasterBotNFT.getAddress(),
      tokenID,
      SALT,
    )

    const MasterBotTBA_0 = await MasterBotRegistry.createAccount(
      await MasterBotAccountImplementation.getAddress(),
      CHAIN_ID,
      await MasterBotNFT.getAddress(),
      tokenID,
      SALT,
      new Uint8Array(),
    )



  })
})