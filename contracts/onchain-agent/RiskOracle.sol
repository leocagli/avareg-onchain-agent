// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract RiskOracle {
    enum RiskLevel {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    struct RiskProfile {
        uint8 score;
        RiskLevel level;
        bool suspiciousActivity;
        bytes32 reportHash;
        uint64 updatedAt;
    }

    address public owner;
    mapping(address => bool) public updater;
    mapping(address => RiskProfile) private risks;

    event RiskProfileUpdated(address indexed wallet, uint8 score, RiskLevel level, bool suspiciousActivity, bytes32 reportHash);
    event UpdaterSet(address indexed account, bool allowed);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    modifier onlyUpdater() {
        require(msg.sender == owner || updater[msg.sender], "ONLY_UPDATER");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setUpdater(address account, bool allowed) external onlyOwner {
        updater[account] = allowed;
        emit UpdaterSet(account, allowed);
    }

    function updateRiskProfile(address wallet, uint8 score, bool suspiciousActivity, bytes32 reportHash) external onlyUpdater {
        require(score <= 100, "INVALID_SCORE");
        RiskLevel level = _levelFor(score, suspiciousActivity);
        risks[wallet] = RiskProfile({
            score: score,
            level: level,
            suspiciousActivity: suspiciousActivity,
            reportHash: reportHash,
            updatedAt: uint64(block.timestamp)
        });
        emit RiskProfileUpdated(wallet, score, level, suspiciousActivity, reportHash);
    }

    function getRisk(address wallet) external view returns (RiskProfile memory) {
        return risks[wallet];
    }

    function _levelFor(uint8 score, bool suspiciousActivity) internal pure returns (RiskLevel) {
        if (suspiciousActivity || score >= 80) return RiskLevel.CRITICAL;
        if (score >= 60) return RiskLevel.HIGH;
        if (score >= 40) return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }
}
