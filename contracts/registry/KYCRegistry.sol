// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract KYCRegistry {
    struct KYCRecord {
        uint8 level;
        bytes32 jurisdiction;
        bytes32 investorType;
        uint64 expiresAt;
        bytes32 dataHash;
        bool revoked;
    }

    address public owner;
    mapping(address => KYCRecord) private records;
    mapping(address => bool) public frozenWallet;
    mapping(address => bool) public blacklistedWallet;

    event KYCApproved(address indexed wallet, uint8 level, bytes32 jurisdiction, uint64 expiresAt, bytes32 dataHash);
    event KYCRevoked(address indexed wallet, string reason);
    event WalletFrozen(address indexed wallet, bool frozen);
    event WalletBlacklisted(address indexed wallet, bool blacklisted);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function approveKYC(
        address wallet,
        uint8 level,
        bytes32 jurisdiction,
        bytes32 investorType,
        uint64 expiresAt,
        bytes32 dataHash
    ) external onlyOwner {
        require(wallet != address(0), "INVALID_WALLET");
        require(expiresAt > block.timestamp, "INVALID_EXPIRY");
        records[wallet] = KYCRecord(level, jurisdiction, investorType, expiresAt, dataHash, false);
        emit KYCApproved(wallet, level, jurisdiction, expiresAt, dataHash);
    }

    function revokeKYC(address wallet, string calldata reason) external onlyOwner {
        records[wallet].revoked = true;
        emit KYCRevoked(wallet, reason);
    }

    function setFrozen(address wallet, bool frozen) external onlyOwner {
        frozenWallet[wallet] = frozen;
        emit WalletFrozen(wallet, frozen);
    }

    function setBlacklisted(address wallet, bool blacklisted) external onlyOwner {
        blacklistedWallet[wallet] = blacklisted;
        emit WalletBlacklisted(wallet, blacklisted);
    }

    function isVerified(address wallet, uint8 minimumLevel) external view returns (bool) {
        KYCRecord memory record = records[wallet];
        return record.level >= minimumLevel && record.expiresAt >= block.timestamp && !record.revoked;
    }

    function getKYC(address wallet) external view returns (KYCRecord memory) {
        return records[wallet];
    }
}
