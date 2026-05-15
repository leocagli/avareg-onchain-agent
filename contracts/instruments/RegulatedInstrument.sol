// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../compliance/ComplianceModule.sol";
import "../compliance/EvidenceLog.sol";

contract RegulatedInstrument {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    address public owner;
    ComplianceModule public compliance;
    EvidenceLog public evidenceLog;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public minter;

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);
    event MinterUpdated(address indexed account, bool allowed);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    modifier onlyMinter() {
        require(minter[msg.sender] || msg.sender == owner, "ONLY_MINTER");
        _;
    }

    constructor(string memory name_, string memory symbol_, ComplianceModule compliance_, EvidenceLog evidenceLog_) {
        name = name_;
        symbol = symbol_;
        owner = msg.sender;
        compliance = compliance_;
        evidenceLog = evidenceLog_;
        minter[msg.sender] = true;
    }

    function setMinter(address account, bool allowed) external onlyOwner {
        minter[account] = allowed;
        emit MinterUpdated(account, allowed);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _checkedTransfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        require(currentAllowance >= amount, "ALLOWANCE_EXCEEDED");
        allowance[from][msg.sender] = currentAllowance - amount;
        emit Approval(from, msg.sender, allowance[from][msg.sender]);
        _checkedTransfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount, bytes32 evidenceHash) external onlyMinter {
        (bool allowed, string memory reason) = compliance.canTransfer(address(this), address(0), to, amount);
        evidenceLog.record(address(this), to, allowed, reason, evidenceHash);
        require(allowed, reason);
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function burn(uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "INSUFFICIENT_BALANCE");
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }

    function _checkedTransfer(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "INSUFFICIENT_BALANCE");
        (bool allowed, string memory reason) = compliance.canTransfer(address(this), from, to, amount);
        evidenceLog.record(address(this), to, allowed, reason, keccak256(abi.encode(from, to, amount, block.number)));
        require(allowed, reason);
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}
