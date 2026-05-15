// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CNVRoleRegistry {
    enum CNVRole {
        ISSUER,
        TRD_ENTITY,
        PSAV,
        ALYC,
        AN,
        AAGI,
        AP,
        CUSTODIAN,
        COMPLIANCE_OFFICER,
        AUDITOR
    }

    address public owner;
    mapping(address => mapping(uint8 => bool)) private roles;

    event RoleGranted(address indexed account, CNVRole indexed role, address indexed grantedBy);
    event RoleRevoked(address indexed account, CNVRole indexed role, address indexed revokedBy);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function grantRole(address account, CNVRole role) external onlyOwner {
        roles[account][uint8(role)] = true;
        emit RoleGranted(account, role, msg.sender);
    }

    function revokeRole(address account, CNVRole role) external onlyOwner {
        roles[account][uint8(role)] = false;
        emit RoleRevoked(account, role, msg.sender);
    }

    function hasActiveRole(address account, CNVRole role) external view returns (bool) {
        return roles[account][uint8(role)];
    }
}
