import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"
import * as dotenv from "dotenv"
dotenv.config()


const CHAIN_ID = ethers.toBigInt(process.env.CHAIN_ID!)
const SALT = ethers.toBigInt(process.env.SALT!)


describe("test ERC6551 accounts' operations for Assets contracts", function () {

  async function deployERC6551andAssets() {
    const [owner, alice, bob, tony] = await ethers.getSigners()

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
    const TBA_0_address = await MasterBotTBA_0.getAddress()
    const TBA_1_address = await MasterBotTBA_1.getAddress()
    const assets_address = await Assets.getAddress()

    // Mint MasterToken & FunctionBot to TBA#0 & TBA#1
    const amount = ethers.parseEther('200')
    await MasterToken.mint(TBA_0_address, amount)
    await MasterToken.mint(TBA_1_address, amount)
    await FunctionBot.safeMint(TBA_0_address, "")   // #0
    await FunctionBot.safeMint(TBA_0_address, "")   // #1
    await FunctionBot.safeMint(TBA_0_address, "")   // #2
    await FunctionBot.safeMint(TBA_1_address, "")   // #3

    // Approve MasterToken & FunctionBot for Assets contract
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
      owner, alice, bob, tony, MasterBotTBA_0, MasterBotTBA_1,
      TBA_0_address, TBA_1_address,
    }
  }



  it("ERC6551 accounts and Assets contracts should deployed successfully", async () => {
    await loadFixture(deployERC6551andAssets)
  })



  it("User journey: operate with Share, Energy and Slots", async () => {
    const {
      MasterBotNFT, MasterToken, FunctionBot, Assets, owner, alice, bob,
      tony, MasterBotTBA_0, MasterBotTBA_1, TBA_0_address, TBA_1_address
    } = await loadFixture(deployERC6551andAssets)


    // Operate with `Share`: purchase and sell Share Tokens
    await MasterBotTBA_0.connect(alice).execute(Assets, 0,
      Assets.interface.encodeFunctionData('purchase'), 0)   // TBA#0 $MTT: 200 - 1 = 199
    await MasterBotTBA_1.connect(bob).execute(Assets, 0,
      Assets.interface.encodeFunctionData('purchase'), 0)   // TBA#1 $MTT: 200 - 2 = 198
    await MasterBotTBA_1.connect(bob).execute(Assets, 0,
      Assets.interface.encodeFunctionData('purchase'), 0)   // TBA#1 $MTT: 198 - 3 = 195
    await MasterBotTBA_0.connect(alice).execute(Assets, 0,  // Admin $MTT: 3 * 5% = 0.15
      Assets.interface.encodeFunctionData('sell'), 0)       // TBA#0 $MTT: 199 + 3 * 95% = 201.85
    await expect(MasterBotTBA_0.connect(alice).execute(Assets, 0,
      Assets.interface.encodeFunctionData('sell'), 0))
      .to.be.revertedWith("You have no Share Tokens to sell")

    expect(await MasterToken.balanceOf(TBA_0_address)).to.equal(ethers.parseEther('201.85'))
    expect(await MasterToken.balanceOf(TBA_1_address)).to.equal(ethers.parseEther('195'))
    expect(await Assets.adminBalance()).to.equal(ethers.parseEther('0.15'))


    // Operate with `Energy`: query energy and charge
    await MasterBotTBA_0.connect(alice).execute(Assets, 0,  // TBA#0 $MTT: 201.85 - 1 = 200.85
      Assets.interface.encodeFunctionData('charge'), 0)
    await time.increase(60 * 60 * 24 * 7)                   // 7 days later
    await MasterBotTBA_0.connect(alice).execute(Assets, 0,  // TBA#0 $MTT: 200.85 - 1 = 199.85
      Assets.interface.encodeFunctionData('charge'), 0)     // TBA#0 Energy: + 20 - 7 + 20 = 33

    expect(await Assets.energyOf(TBA_0_address)).to.equal(33)
    expect(await MasterToken.balanceOf(TBA_0_address)).to.equal(ethers.parseEther('199.85'))


    // Operate with `Slots`: install and uninstall FunctionBot
    await MasterBotTBA_0.connect(alice).execute(Assets, 0,  // TBA#0 $MTT: 199.85 - 10 = 189.85
      Assets.interface.encodeFunctionData('installBot', [0, 1]), 0)
    await expect(MasterBotTBA_0.connect(alice).execute(Assets, 0,
      Assets.interface.encodeFunctionData('installBot', [0, 2]), 0))
      .to.be.revertedWith("Slot is already occupied.")
    await expect(MasterBotTBA_0.connect(alice).execute(Assets, 0,
      Assets.interface.encodeFunctionData('installBot', [1, 3]), 0))
      .to.be.revertedWith("You do not own this bot!")
    await MasterBotTBA_0.connect(alice).execute(Assets, 0,  // TBA#0 $MTT: 189.85 - 10 = 179.85
      Assets.interface.encodeFunctionData('installBot', [3, 2]), 0)
    await expect(MasterBotTBA_0.connect(alice).execute(Assets, 0,
      Assets.interface.encodeFunctionData('uninstallBot', [4]), 0))
      .to.be.revertedWith("Slot is empty.")

    expect(await Assets.slotsOf(TBA_0_address)).to.deep.equal([1, 0, 0, 2, 0])
    expect(await Assets.isInstalledOn(1)).to.equal(TBA_0_address)
    expect(await Assets.isInstalledOn(3)).to.equal(ethers.ZeroAddress)
    expect(await FunctionBot.balanceOf(TBA_0_address)).to.equal(1)
    expect(await FunctionBot.balanceOf(await Assets.getAddress())).to.equal(2)

    await MasterBotTBA_0.connect(alice).execute(Assets, 0,  // TBA#0 $MTT: 179.85 - 10 = 169.85
      Assets.interface.encodeFunctionData('uninstallBot', [3]), 0)

    expect(await Assets.slotsOf(TBA_0_address)).to.deep.equal([1, 0, 0, 0, 0])
    expect(await Assets.adminBalance()).to.equal(ethers.parseEther('32.15'))


    // Transfer MasterBot#0 to Tony
    expect(await MasterBotTBA_0.isValidSigner(alice.address, '0x')).to.equal('0x523e3260')
    expect(await MasterBotTBA_0.isValidSigner(tony.address, '0x')).to.equal('0x00000000')
    await MasterBotNFT.connect(alice).transferFrom(alice.address, tony.address, 0)
    expect(await MasterBotTBA_0.isValidSigner(alice.address, '0x')).to.equal('0x00000000')
    expect(await MasterBotTBA_0.isValidSigner(tony.address, '0x')).to.equal('0x523e3260')


    // Tony continue to use MasterBot#0's TBA
    await expect(MasterBotTBA_0.connect(alice).execute(Assets, 0,
      Assets.interface.encodeFunctionData('charge'), 0))
      .to.be.revertedWith('Invalid signer')
    await MasterBotTBA_0.connect(tony).execute(Assets, 0,  // TBA#0 $MTT: 169.85 - 10 = 159.85
      Assets.interface.encodeFunctionData('charge'), 0)    // TBA#0 Energy: 33 + 20 = 53
    await time.increase(60 * 60 * 24 * 7)                     // 7 days later
    expect(await Assets.energyOf(TBA_0_address)).to.equal(46) // 53 - 7 = 46


    // Admin withdraw all the collected fees
    expect(await Assets.adminBalance()).to.equal(ethers.parseEther('33.15'))
    await expect(Assets.connect(alice)._claimAll())
      .to.be.revertedWith("Ownable: caller is not the owner")
    await Assets.connect(owner)._claimAll()
    expect(await Assets.adminBalance()).to.equal(ethers.parseEther('0'))
    expect(await MasterToken.balanceOf(owner.address)).to.equal(ethers.parseEther('33.15'))
    expect(await MasterToken.balanceOf(await Assets.getAddress()))
      .to.equal(ethers.parseEther('3'))                     // 1 + 2 + 3 - 3 = 3
  })

})