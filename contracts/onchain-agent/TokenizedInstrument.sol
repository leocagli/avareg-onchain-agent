// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TokenizedInstrument {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    address public owner;
    mapping(address => bool) public authorizedInstitution;
    mapping(address => uint256) public balanceOf;
    uint256 public totalSupply;

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event InstitutionAuthorizationUpdated(address indexed institution, bool authorized);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    modifier onlyAuthorizedInstitution() {
        require(authorizedInstitution[msg.sender], "ONLY_AUTHORIZED_INSTITUTION");
        _;
    }

    constructor(string memory name_, string memory symbol_) {
        owner = msg.sender;
        name = name_;
        symbol = symbol_;
        authorizedInstitution[msg.sender] = true;
    }

    function setAuthorizedInstitution(address institution, bool authorized) external onlyOwner {
        authorizedInstitution[institution] = authorized;
        emit InstitutionAuthorizationUpdated(institution, authorized);
    }

    function mintDemoPosition(address to, uint256 amount) external onlyAuthorizedInstitution {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function burnDemoPosition(address from, uint256 amount) external onlyAuthorizedInstitution {
        require(balanceOf[from] >= amount, "INSUFFICIENT_BALANCE");
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }

    function moveDemoPosition(address from, address to, uint256 amount) external onlyAuthorizedInstitution {
        require(balanceOf[from] >= amount, "INSUFFICIENT_BALANCE");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}
