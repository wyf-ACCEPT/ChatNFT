// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Share is Ownable {
    uint256 public immutable taxBasePoint = 500;
    uint256 public immutable decimals;
    IERC20 public immutable masterToken;
    mapping(address => uint256) _balanceOf;
    uint256 _totalSupply;

    event Purchased(address indexed buyer, uint256 totalSupplyNow);
    event Sold(address indexed seller, uint256 totalSupplyNow);

    constructor(address _masterTokenAddress) {
        decimals = IERC20Metadata(_masterTokenAddress).decimals();
        masterToken = IERC20(_masterTokenAddress);
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address user) public view returns (uint256) {
        return _balanceOf[user];
    }

    function purchase() public returns (bool) {
        uint256 cost = (_totalSupply + 1) * 10**decimals;

        require(
            masterToken.transferFrom(msg.sender, address(this), cost),
            "Transfer of MasterTokens failed"
        );

        _totalSupply += 1;
        _balanceOf[msg.sender] += 1;

        emit Purchased(msg.sender, _totalSupply);
        return true;
    }

    function sell() public returns (bool) {
        require(_balanceOf[msg.sender] > 0, "You have no Share Tokens to sell");

        uint256 reward = _totalSupply * 10**decimals;
        uint256 tax = (reward * taxBasePoint) / 10000;

        require(
            masterToken.transfer(msg.sender, reward - tax),
            "Transfer of MasterTokens failed"
        );

        _totalSupply -= 1;
        _balanceOf[msg.sender] -= 1;

        emit Sold(msg.sender, _totalSupply);
        return true;
    }

    function _claimAll() public onlyOwner {
        masterToken.transfer(owner(), masterToken.balanceOf(address(this)));
    }
}
