// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Assets is Ownable {
    /* ----------- Structs used for assets management. ----------- */
    struct MasterBotEnergy {
        uint256 lastUpdated;
        uint256 energyHistorical;
    }

    struct MasterBotSlots {
        uint256[5] bots; // To save 5 functionBots' tokenId.
    }

    /* -- Constant variables. Should double confirmed by admin. -- */
    uint256 public constant TAX_BASE_POINT = 500;
    uint256 public constant ENERGY_REDUCE_FREQ = 1 days;
    uint256 public constant CHARGE_PRICE = 1;
    uint256 public constant INSTALL_PRICE = 10;
    uint256 public immutable charge_price_integer;
    uint256 public immutable install_price_integer;
    uint256 public immutable decimals;
    IERC20 public immutable masterToken;
    IERC721 public immutable functionBot;

    /* --------------------- State variables. --------------------- */
    uint256 _totalSupplyShare;
    uint256 _adminBalance;
    mapping(address => uint256) _balanceOf;
    mapping(address => MasterBotEnergy) _energyOf;
    mapping(address => MasterBotSlots) _slotsOf;
    mapping(uint256 => address) _isInstalledOn;

    /* --------- Events used for Share, Energy and Slots. --------- */
    event SharePurchased(address indexed buyer, uint256 totalSupplyNow);
    event ShareSold(address indexed seller, uint256 totalSupplyNow);
    event Charge(address indexed masterbot, uint256 newEnergy);
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
        masterToken = IERC20(_masterTokenAddress);
        functionBot = IERC721(_functionBotAddress);
        charge_price_integer = CHARGE_PRICE * 10**decimals;
        install_price_integer = INSTALL_PRICE * 10**decimals;
    }

    /* ---------------------- View functions ---------------------- */
    function totalSupplyShare() public view returns (uint256) {
        return _totalSupplyShare;
    }

    function balanceShareOf(address user) public view returns (uint256) {
        return _balanceOf[user];
    }

    function balanceMasterTokenOf(address user) public view returns (uint256) {
        return masterToken.balanceOf(user);
    }

    function energyOf(address masterbot) public view returns (uint256) {
        uint256 timeElapsed = block.timestamp -
            _energyOf[masterbot].lastUpdated;
        uint256 energyToDeduct = timeElapsed / ENERGY_REDUCE_FREQ;
        uint256 energyHistorical = _energyOf[masterbot].energyHistorical;

        if (energyHistorical >= energyToDeduct) {
            return energyHistorical - energyToDeduct;
        } else {
            return 0;
        }
    }

    function isInstalledOn(uint256 tokenId) public view returns (address) {
        return _isInstalledOn[tokenId];
    }

    function slotsOf(address masterbot)
        public
        view
        returns (uint256[5] memory)
    {
        return _slotsOf[masterbot].bots;
    }

    function adminBalance() public view returns (uint256) {
        return _adminBalance;
    }

    /* -------- Functions for purchasing/selling Share-token. -------- */
    function purchase() public returns (bool) {
        uint256 cost = (_totalSupplyShare + 1) * 10**decimals;

        require(
            masterToken.transferFrom(msg.sender, address(this), cost),
            "Transfer of MasterTokens failed"
        );

        _totalSupplyShare += 1;
        _balanceOf[msg.sender] += 1;

        emit SharePurchased(msg.sender, _totalSupplyShare);
        return true;
    }

    function sell() public returns (bool) {
        require(_balanceOf[msg.sender] > 0, "You have no Share Tokens to sell");

        uint256 reward = _totalSupplyShare * 10**decimals;
        uint256 tax = (reward * TAX_BASE_POINT) / 10000;

        require(
            masterToken.transfer(msg.sender, reward - tax),
            "Transfer of MasterTokens failed"
        );
        _adminBalance += tax;

        _totalSupplyShare -= 1;
        _balanceOf[msg.sender] -= 1;

        emit ShareSold(msg.sender, _totalSupplyShare);
        return true;
    }

    /* --------- Function for charging for the MasterBot. --------- */
    function charge() public returns (bool) {
        require(
            masterToken.transferFrom(
                msg.sender,
                address(this),
                charge_price_integer
            ),
            "Transfer of MasterTokens failed"
        );
        _adminBalance += charge_price_integer;

        uint256 currentEnergy = energyOf(msg.sender);
        uint256 newEnergy = currentEnergy + 20 < 100 ? currentEnergy + 20 : 100;
        require(currentEnergy != 100, "No need to charge!");

        _energyOf[msg.sender].lastUpdated = block.timestamp;
        _energyOf[msg.sender].energyHistorical = newEnergy;

        emit Charge(msg.sender, newEnergy);
        return true;
    }

    /* ---- Functions for installing/uninstalling a FunctionBot. ---- */
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
            masterToken.transferFrom(
                msg.sender,
                address(this),
                install_price_integer
            ),
            "Transfer of MasterTokens failed."
        );
        _adminBalance += install_price_integer;
        functionBot.transferFrom(msg.sender, address(this), tokenId);
        _slotsOf[msg.sender].bots[slotId] = tokenId;
        _isInstalledOn[tokenId] = msg.sender;

        emit Installed(msg.sender, slotId, tokenId);
        return true;
    }

    function uninstallBot(uint256 slotId) public returns (bool) {
        require(slotId < 5, "Invalid slot ID");
        require(_slotsOf[msg.sender].bots[slotId] != 0, "Slot is empty.");

        require(
            masterToken.transferFrom(
                msg.sender,
                address(this),
                install_price_integer
            ),
            "Transfer of MasterTokens failed."
        );
        _adminBalance += install_price_integer;
        uint256 tokenId = _slotsOf[msg.sender].bots[slotId];
        functionBot.transferFrom(address(this), msg.sender, tokenId);
        _slotsOf[msg.sender].bots[slotId] = 0;
        _isInstalledOn[tokenId] = address(0);

        emit Uninstalled(msg.sender, slotId, tokenId);
        return true;
    }

    /* ----------------------- Functions for admin. ----------------------- */
    function _claimAll() public onlyOwner {
        masterToken.transfer(owner(), _adminBalance);
        _adminBalance = 0;
    }
}
