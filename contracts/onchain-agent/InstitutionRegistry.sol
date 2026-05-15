// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract InstitutionRegistry {
    struct Institution {
        bytes32 institutionType;
        bytes32 country;
        bytes32 registryIdHash;
        bool active;
        string name;
    }

    address public owner;
    mapping(address => Institution) private institutions;

    event InstitutionRegistered(address indexed institution, bytes32 institutionType, bytes32 country, string name);
    event InstitutionStatusUpdated(address indexed institution, bool active);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerInstitution(
        address institution,
        bytes32 institutionType,
        bytes32 country,
        bytes32 registryIdHash,
        string calldata name,
        bool active
    ) external onlyOwner {
        require(institution != address(0), "INVALID_INSTITUTION");
        institutions[institution] = Institution(institutionType, country, registryIdHash, active, name);
        emit InstitutionRegistered(institution, institutionType, country, name);
    }

    function setInstitutionStatus(address institution, bool active) external onlyOwner {
        institutions[institution].active = active;
        emit InstitutionStatusUpdated(institution, active);
    }

    function getInstitution(address institution) external view returns (Institution memory) {
        return institutions[institution];
    }
}
