// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract Energy {
    struct UserEnergy {
        uint256 lastUpdated;
        uint256 energyHistorical;
    }

    uint256 public immutable decimals;
    uint256 public immutable FREQ = 1 days;
    mapping(address => UserEnergy) _userEnergy;
    IERC20 public masterToken;

    event Charge(address indexed masterbot, uint256 newEnergy);

    constructor(address _masterToken) {
        decimals = IERC20Metadata(_masterToken).decimals();
        masterToken = IERC20(_masterToken);
    }

    function charge() public returns (bool) {
        uint256 cost = 10**decimals;
        require(
            masterToken.transferFrom(msg.sender, address(this), cost),
            "Transfer of MasterTokens failed"
        );

        uint256 currentEnergy = queryEnergy(msg.sender);
        uint256 newEnergy = currentEnergy + 20 < 100 ? currentEnergy + 20 : 100;
        require(currentEnergy != 100, "No need to charge!");

        _userEnergy[msg.sender].lastUpdated = block.timestamp;
        _userEnergy[msg.sender].energyHistorical = newEnergy;

        emit Charge(msg.sender, newEnergy);
        return true;
    }

    function queryEnergy(address masterbot) public view returns (uint256) {
        uint256 timeElapsed = block.timestamp -
            _userEnergy[masterbot].lastUpdated;
        uint256 energyToDeduct = timeElapsed / FREQ;
        uint256 energyHistorical = _userEnergy[masterbot].energyHistorical;

        if (energyHistorical >= energyToDeduct) {
            return energyHistorical - energyToDeduct;
        } else {
            return 0;
        }
    }
}
