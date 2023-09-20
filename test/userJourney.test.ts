import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"
import * as dotenv from "dotenv"
dotenv.config()


const CHAIN_ID = ethers.toBigInt(process.env.CHAIN_ID!)
const SALT = ethers.toBigInt(process.env.SALT!)


describe("test ERC6551 accounts' operations for Assets contracts", function () {

  async function deployERC6551andAssets() {
    const [owner, alice, bob] = await ethers.getSigners()

    // Deploy MasterBot NFT, FunctionBot NFT and MasterToken
    const MasterBotNFT = await ethers.deployContract("MasterBotNFT")
    const MasterToken = await ethers.deployContract('MasterToken')
    const FunctionBot = await ethers.deployContract('FunctionBot')

    // Deploy Assets contract
    const AssetsFactory = await ethers.getContractFactory('Assets')
    const Assets = await AssetsFactory.deploy(
      await MasterToken.getAddress(), await FunctionBot.getAddress()
    )

    // Mint MasterBot NFT
    await MasterBotNFT.safeMint(alice.address)
    await MasterBotNFT.safeMint(bob.address)

    // Register the Token-bound Account for Alice's MasterBot#0 and Bob's MasterBot#1
    const MasterBotAccountImplementation = await ethers.deployContract("MasterBotTokenBoundAccount")
    const MasterBotRegistry = await ethers.deployContract("ERC6551Registry")
    const MasterBotTBAs = []
    for (var tokenID of [0, 1]) {
      const MasterBotTBA_address = await MasterBotRegistry.account(
        await MasterBotAccountImplementation.getAddress(),
        CHAIN_ID,
        await MasterBotNFT.getAddress(),
        tokenID,
        SALT,
      )
      await MasterBotRegistry.createAccount(
        await MasterBotAccountImplementation.getAddress(),
        CHAIN_ID,
        await MasterBotNFT.getAddress(),
        tokenID,
        SALT,
        new Uint8Array(),
      )
      const MasterBotTBA = await ethers.getContractAt(
        "MasterBotTokenBoundAccount",
        MasterBotTBA_address,
      )
      MasterBotTBAs.push(MasterBotTBA)
    }
    const [MasterBotTBA_0, MasterBotTBA_1] = MasterBotTBAs
    const MasterBotTBA_0_address = await MasterBotTBA_0.getAddress()
    const MasterBotTBA_1_address = await MasterBotTBA_1.getAddress()
    const assets_address = await Assets.getAddress()

    // Mint MasterToken & FunctionBot to TBA#0 & TBA#1
    const amount = ethers.parseEther('200')
    await MasterToken.mint(MasterBotTBA_0_address, amount)
    await MasterToken.mint(MasterBotTBA_1_address, amount)
    await FunctionBot.safeMint(MasterBotTBA_0_address, "")   // #0
    await FunctionBot.safeMint(MasterBotTBA_0_address, "")   // #1
    await FunctionBot.safeMint(MasterBotTBA_0_address, "")   // #2
    await FunctionBot.safeMint(MasterBotTBA_1_address, "")   // #3

    // Approve MasterToken & FunctionBot to Assets contract
    await MasterBotTBA_0.connect(alice).execute(MasterToken, 0,
      MasterToken.interface.encodeFunctionData('approve', [assets_address, amount]), 0)
    await MasterBotTBA_1.connect(bob).execute(MasterToken, 0,
      MasterToken.interface.encodeFunctionData('approve', [assets_address, amount]), 0)
    await MasterBotTBA_0.connect(alice).execute(FunctionBot, 0,
      FunctionBot.interface.encodeFunctionData('setApprovalForAll', [assets_address, true]), 0)
    await MasterBotTBA_1.connect(bob).execute(FunctionBot, 0,
      FunctionBot.interface.encodeFunctionData('approve', [assets_address, 3]), 0)

    return {
      MasterBotNFT, MasterToken, FunctionBot, Assets,
      owner, alice, bob, MasterBotTBA_0, MasterBotTBA_1,
    }
  }



  it("ERC6551 accounts and Assets contracts should deployed successfully", async () => {
    await loadFixture(deployERC6551andAssets)
  })


})