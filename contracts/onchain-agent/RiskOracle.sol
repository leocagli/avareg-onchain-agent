// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract RiskOracle {
    enum RiskLevel {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }
    using ECDSA for bytes32;

    struct RiskProfile {
        uint8 score;
        RiskLevel level;
        bool suspiciousActivity;
        bytes32 reportHash;
        uint64 updatedAt;
    }
    // La dirección pública de la wallet que pusiste en tu .env (AGENT_PRIVATE_KEY)
    address public agentAddress;

    address public owner;
    mapping(address => bool) public updater;
    mapping(address => RiskProfile) private risks;
    // Mapeo para guardar el último score de riesgo de una wallet
    mapping(address => uint8) public userRiskScores;

    event RiskProfileUpdated(address indexed wallet, uint8 score, RiskLevel level, bool suspiciousActivity, bytes32 reportHash);
    event UpdaterSet(address indexed account, bool allowed);
    event RiskAttested(address indexed user, uint8 score);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    modifier onlyUpdater() {
        require(msg.sender == owner || updater[msg.sender], "ONLY_UPDATER");
        _;
    }
    // Función que llamará el frontend enviando la firma generada por agent.ts
    function recordRiskScore(address user, uint8 riskScore, bytes memory signature) public {
        // 1. Recrear el hash exacto que firmó tu backend (agent.ts)
        bytes32 messageHash = keccak256(abi.encodePacked(user, riskScore));
        
        // 2. Agregar el prefijo estándar de Ethereum (EIP-191)
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        
        // 3. Recuperar qué dirección firmó el mensaje
        address recoveredSigner = ECDSA.recover(ethSignedMessageHash, signature);
        
        // 4. Validar que la firma proviene exclusivamente de tu servidor
        require(recoveredSigner == agentAddress, "RiskOracle: Firma del agente invalida");

        // 5. Guardar el estado permanentemente en Avalanche
        userRiskScores[user] = riskScore;
        
        emit RiskAttested(user, riskScore);
    }

    constructor(address _agentAddress) {
        owner = msg.sender;
        agentAddress = _agentAddress;
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
