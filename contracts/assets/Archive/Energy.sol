// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Energy is Ownable {
    struct MasterBotEnergy {
        uint256 lastUpdated;
        uint256 energyHistorical;
    }

    uint256 public immutable FREQ = 1 days;
    uint256 public immutable decimals;
    IERC20 public immutable masterToken;
    mapping(address => MasterBotEnergy) _energyOf;

    event Charge(address indexed masterbot, uint256 newEnergy);

    constructor(address _masterTokenAddress) {
        decimals = IERC20Metadata(_masterTokenAddress).decimals();
        masterToken = IERC20(_masterTokenAddress);
    }

    function energyOf(address masterbot) public view returns (uint256) {
        uint256 timeElapsed = block.timestamp -
            _energyOf[masterbot].lastUpdated;
        uint256 energyToDeduct = timeElapsed / FREQ;
        uint256 energyHistorical = _energyOf[masterbot].energyHistorical;

        if (energyHistorical >= energyToDeduct) {
            return energyHistorical - energyToDeduct;
        } else {
            return 0;
        }
    }

    function charge() public returns (bool) {
        uint256 cost = 10**decimals;
        require(
            masterToken.transferFrom(msg.sender, address(this), cost),
            "Transfer of MasterTokens failed"
        );

        uint256 currentEnergy = energyOf(msg.sender);
        uint256 newEnergy = currentEnergy + 20 < 100 ? currentEnergy + 20 : 100;
        require(currentEnergy != 100, "No need to charge!");

        _energyOf[msg.sender].lastUpdated = block.timestamp;
        _energyOf[msg.sender].energyHistorical = newEnergy;

        emit Charge(msg.sender, newEnergy);
        return true;
    }

    function _claimAll() public onlyOwner {
        masterToken.transfer(owner(), masterToken.balanceOf(address(this)));
    }
}
