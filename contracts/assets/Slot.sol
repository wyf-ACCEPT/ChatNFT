// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Slot is Ownable {
    struct MasterBotSlots {
        uint256[5] bots; // To save 5 functionBots' tokenId.
    }

    uint256 public immutable installPrice;
    uint256 public immutable decimals;
    IERC20 public immutable masterToken;
    IERC721 public immutable functionBot;
    mapping(address => MasterBotSlots) _slotsOf;

    event Installed(
        address indexed masterBotTBA,
        uint256 indexed slotId,
        uint256 indexed tokenId
    );
    event Uninstalled(
        address indexed masterBotTBA,
        uint256 indexed slotId,
        uint256 indexed tokenId
    );

    constructor(address _masterTokenAddress, address _functionBotAddress) {
        decimals = IERC20Metadata(_masterTokenAddress).decimals();
        installPrice = 10 * 10**decimals;
        masterToken = IERC20(_masterTokenAddress);
        functionBot = IERC721(_functionBotAddress);
    }

    function slotsOf(address masterbot) public view returns (uint256[5] memory) {
        return _slotsOf[masterbot].bots;
    }

    function installBot(uint256 slotId, uint256 tokenId) public returns (bool) {
        require(tokenId != 0, "FunctionBot #0 is the reserved one!");
        require(slotId < 5, "Invalid slot ID");
        require(
            _slotsOf[msg.sender].bots[slotId] == 0,
            "Slot is already occupied."
        );
        require(
            functionBot.ownerOf(tokenId) == msg.sender,
            "You do not own this bot!"
        );

        require(
            masterToken.transferFrom(msg.sender, address(this), installPrice),
            "Transfer of MasterTokens failed."
        );
        functionBot.transferFrom(msg.sender, address(this), tokenId);
        _slotsOf[msg.sender].bots[slotId] = tokenId;

        emit Installed(msg.sender, slotId, tokenId);
        return true;
    }

    function uninstallBot(uint256 slotId) public returns (bool) {
        require(slotId < 5, "Invalid slot ID");
        require(_slotsOf[msg.sender].bots[slotId] != 0, "Slot is empty.");

        require(
            masterToken.transferFrom(msg.sender, address(this), installPrice),
            "Transfer of MasterTokens failed."
        );
        uint256 tokenId = _slotsOf[msg.sender].bots[slotId];
        functionBot.transferFrom(address(this), msg.sender, tokenId);
        _slotsOf[msg.sender].bots[slotId] = 0;

        emit Uninstalled(msg.sender, slotId, tokenId);
        return true;
    }

    function _claimAll() public onlyOwner {
        masterToken.transfer(owner(), masterToken.balanceOf(address(this)));
    }
}
