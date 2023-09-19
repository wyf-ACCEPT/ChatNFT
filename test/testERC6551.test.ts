import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"
import * as dotenv from "dotenv"
dotenv.config()


const CHAIN_ID = ethers.toBigInt(process.env.CHAIN_ID!)
const SALT = ethers.toBigInt(process.env.SALT!)


describe("test ERC6551 accounts' operations", function () {

  async function deployERC6551() {
    const [owner, alice, bob] = await ethers.getSigners()

    const MasterBotNFT = await ethers.deployContract("MasterBotNFT")
    await MasterBotNFT.safeMint(alice.address)
    await MasterBotNFT.safeMint(bob.address)

    const MasterBotAccountImplementation = await ethers.deployContract("MasterBotTokenBoundAccount")
    const MasterBotRegistry = await ethers.deployContract("ERC6551Registry")

    // Register the Token-bound Account for Alice's MasterBot#0 and Bob's MasterBot#1
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

    return {
      MasterBotNFT, owner, alice, bob, MasterBotTBA_0, MasterBotTBA_1,
    }
  }


  it("MasterBot NFT should be deployed successfully", async function () {
    const [_owner, alice, bob] = await ethers.getSigners()
    const MasterBotNFT = await ethers.deployContract("MasterBotNFT")

    await MasterBotNFT.safeMint(alice.address)
    await MasterBotNFT.safeMint(bob.address)
    expect(await MasterBotNFT.balanceOf(alice.address)).to.equal(1)
    expect(await MasterBotNFT.ownerOf(1)).to.equal(bob.address)
  })


  it("MasterBot TBA's view functions should be executed successfully", async () => {
    const { MasterBotNFT, alice, MasterBotTBA_0 } = await loadFixture(deployERC6551)

    expect((await MasterBotTBA_0.token())[1]).to.equal(await MasterBotNFT.getAddress())
    expect(await MasterBotTBA_0.supportsInterface('0x6faff5f1')).to.be.true // Support IERC6551Account
    expect(await MasterBotTBA_0.supportsInterface('0xffffffff')).to.be.false
    expect(await MasterBotTBA_0.owner()).to.equal(alice.address)
    expect(await MasterBotTBA_0.state()).to.equal(0)
  })


  it("MasterBot TBA can operate ERC20 token", async () => {
    const { MasterBotTBA_0, alice } = await loadFixture(deployERC6551)

    // Firstly deploy the ERC20 MasterToken
    const MasterToken = await ethers.deployContract('MasterToken')
    await MasterToken.mint(alice.address, 100)
    expect(await MasterToken.balanceOf(alice.address)).to.equal(100)
    const MasterBotTBA_0_address = await MasterBotTBA_0.getAddress()
    await MasterToken.mint(MasterBotTBA_0_address, 80)
    expect(await MasterToken.balanceOf(MasterBotTBA_0_address)).to.equal(80)

    // Parse the raw data of a transaction, and use it as the param of TBA `execute` function
    const transferData = MasterToken.interface.encodeFunctionData('transfer', [alice.address, 50])
    await MasterBotTBA_0.connect(alice).execute(MasterToken, 0, transferData, 0)
    expect(await MasterToken.balanceOf(alice.address)).to.equal(150)
    expect(await MasterToken.balanceOf(MasterBotTBA_0_address)).to.equal(30)
  })

})