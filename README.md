# ChatNFT

## File structure

```rust
├── contract
│   ├── assets
│   │   ├── Energy.sol
│   │   ├── FunctionBot.sol         // ERC721 NFT
│   │   ├── MasterToken.sol         // ERC20 token
│   │   ├── Share.sol
│   │   └── Slot.sol
│   ├── interface
│   │   ├── IERC6551Account.sol
│   │   ├── IERC6551Executable.sol
│   │   └── IERC6551Registry.sol
│   └── tokenbound
│       ├── ERC6551Registry.sol     // ERC6551 registry
│       ├── MasterBotNFT.sol        // ERC721 NFT
│       └── MasterBotTBA.sol        // ERC6551 implementation
└── ...
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
Deploy [  ---  ] Share for MTB (Share.sol)
Deploy [  ---  ] Enegry for MTB (Energy.sol)
```