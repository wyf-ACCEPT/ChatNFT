// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Slot {
    struct MasterBot {
        address functionBotAddress;
        uint256[5] tokenId;
    }

    uint256 public immutable decimals;
    IERC20 public immutable masterToken;
    // IERC721 public immutable functionBotNFT;
    mapping(address => uint256[5]) _slotsOf;

    event equipSlot(
        address indexed masterBotTBA,
        address indexed functionBotAddress,
        uint256 indexed tokenId,
        uint256 slotId
    );
    event unloadSlot(
        address indexed masterBotTBA,
        address indexed functionBotAddress,
        uint256 indexed tokenId,
        uint256 slotId
    );

    constructor(address _masterTokenAddress) {
        decimals = IERC20Metadata(_masterTokenAddress).decimals();
        masterToken = IERC20(_masterTokenAddress);
    }
}
