// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SampleToken
 * @notice A simple ERC20-like token for demonstrating event filtering
 * @dev This contract is for educational purposes
 */
contract SampleToken {
    string public name = "Sample Token";
    string public symbol = "SMPL";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // Standard Transfer event - 2 indexed parameters
    event Transfer(
        address indexed from,
        address indexed to,
        uint256 value
    );

    // Approval event
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    // Custom event with 3 indexed parameters (max allowed)
    event LargeTransfer(
        address indexed from,
        address indexed to,
        uint256 indexed tier, // 1 = 100+, 2 = 1000+, 3 = 10000+
        uint256 amount,
        uint256 timestamp
    );

    // Event with no indexed parameters
    event TokensBurned(
        address burner,
        uint256 amount,
        string reason
    );

    constructor(uint256 initialSupply) {
        totalSupply = initialSupply * 10 ** decimals;
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        require(to != address(0), "Invalid address");

        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;

        emit Transfer(msg.sender, to, value);

        // Emit special event for large transfers
        _checkLargeTransfer(msg.sender, to, value);

        return true;
    }

    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        require(to != address(0), "Invalid address");

        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;

        emit Transfer(from, to, value);

        _checkLargeTransfer(from, to, value);

        return true;
    }

    function burn(uint256 value, string memory reason) public {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");

        balanceOf[msg.sender] -= value;
        totalSupply -= value;

        emit Transfer(msg.sender, address(0), value);
        emit TokensBurned(msg.sender, value, reason);
    }

    function _checkLargeTransfer(address from, address to, uint256 value) private {
        uint256 tier;
        uint256 threshold = 100 * 10 ** decimals;

        if (value >= threshold * 100) {
            tier = 3;
        } else if (value >= threshold * 10) {
            tier = 2;
        } else if (value >= threshold) {
            tier = 1;
        } else {
            return; // Not a large transfer
        }

        emit LargeTransfer(from, to, tier, value, block.timestamp);
    }
}
