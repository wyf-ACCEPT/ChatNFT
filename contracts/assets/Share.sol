// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract Share {
    uint256 public totalSupply;
    uint256 public taxBasePoint; // usually 500 (5%)
    uint256 public immutable decimals;
    mapping(address => uint256) public balanceOf;
    IERC20 public masterToken;

    event Purchased(address indexed buyer);
    event Sold(address indexed seller);

    constructor(address _masterToken, uint256 _taxBasePoint) {
        decimals = IERC20Metadata(_masterToken).decimals();
        masterToken = IERC20(_masterToken);
        taxBasePoint = _taxBasePoint;
    }

    function purchase() external returns (bool) {
        uint256 cost = (totalSupply + 1) * 10 ** decimals;

        require(
            masterToken.transferFrom(msg.sender, address(this), cost),
            "Transfer of MasterTokens failed"
        );

        totalSupply += 1;
        balanceOf[msg.sender] += 1;

        emit Purchased(msg.sender);
        return true;
    }

    function sell() external returns (bool) {
        require(balanceOf[msg.sender] > 0, "You have no Share Tokens to sell");

        uint256 reward = totalSupply * 10 ** decimals;
        uint256 tax = reward * taxBasePoint / 10000;

        require(
            masterToken.transfer(msg.sender, reward - tax),
            "Transfer of MasterTokens failed"
        );

        totalSupply -= 1;
        balanceOf[msg.sender] -= 1;

        emit Sold(msg.sender);
        return true;
    }
}
