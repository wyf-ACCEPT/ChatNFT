# ChatNFT

## File structure
```Rust
contracts
├── assets
│   ├── Assets.sol
│   ├── FunctionBot.sol         // ERC721 NFT
│   └── MasterToken.sol         // ERC20 token
├── interface
│   ├── IERC6551Account.sol
│   ├── IERC6551Executable.sol
│   └── IERC6551Registry.sol
└── tokenbound
    ├── ERC6551Registry.sol     // ERC6551 registry
    ├── MasterBotNFT.sol        // ERC721 NFT
    └── MasterBotTBA.sol        // ERC6551 implementation
```

## Pseudo code for test

```
Deploy [ ERC721] MasterBot NFT (MasterBotNFT.sol)
    Mint MTB#0 for @Alice
    Mint MTB#1 for @Bob
Deploy [ERC6551] MasterBot token-bound account implementation (MasterBotTBA.sol)
Deploy [ERC6551] MasterBot TBA registry contract (ERC6551Registry.sol)
    createAccount TBA#0 for @MTB#0
    createAccount TBA#1 for @MTB#1
Deploy [ ERC721] FunctionBot NFT (FunctionBotNFT.sol)
    Mint FTB#0 for @TBA#0
    Mint FTB#1 for @TBA#0
    Mint FTB#2 for @TBA#0
Deploy [ ERC20 ] MasterToken (MasterToken.sol)
Deploy [  ---  ] Assets for MTB (Share.sol)
```

## Flatten the code

```bash
mkdir ./contracts/flatten
npx hardhat flatten ./contracts/tokenbound/MasterBotNFT.sol > ./contracts/flatten/FlattenMasterBotNFT.sol
npx hardhat flatten ./contracts/tokenbound/MasterBotTBA.sol > ./contracts/flatten/FlattenMasterBotTBA.sol
npx hardhat flatten ./contracts/tokenbound/ERC6551Registry.sol > ./contracts/flatten/FlattenERC6551Registry.sol
npx hardhat flatten ./contracts/assets/MasterToken.sol > ./contracts/flatten/FlattenMasterToken.sol
npx hardhat flatten ./contracts/assets/FunctionBot.sol > ./contracts/flatten/FlattenFunctionBot.sol
npx hardhat flatten ./contracts/assets/Assets.sol > ./contracts/flatten/FlattenAssets.sol
```