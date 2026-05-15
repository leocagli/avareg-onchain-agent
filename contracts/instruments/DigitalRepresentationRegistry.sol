// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract DigitalRepresentationRegistry {
    struct InstrumentConfig {
        address issuer;
        address trdEntity;
        address psav;
        uint8 minimumKYCLevel;
        bytes32 allowedJurisdiction;
        uint16 maxHoldingBps;
        uint64 lockupUntil;
        bool active;
        bool paused;
        bytes32 documentHash;
        string name;
    }

    address public owner;
    mapping(address => InstrumentConfig) private configs;

    event InstrumentRegistered(address indexed instrument, address indexed issuer, string name, bytes32 documentHash);
    event InstrumentStatusUpdated(address indexed instrument, bool active, bool paused);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerInstrument(address instrument, InstrumentConfig calldata config) external onlyOwner {
        require(instrument != address(0), "INVALID_INSTRUMENT");
        require(config.issuer != address(0), "INVALID_ISSUER");
        require(config.trdEntity != address(0), "INVALID_TRD");
        require(config.psav != address(0), "INVALID_PSAV");
        require(config.maxHoldingBps <= 10_000, "INVALID_MAX_HOLDING");
        configs[instrument] = config;
        emit InstrumentRegistered(instrument, config.issuer, config.name, config.documentHash);
    }

    function setStatus(address instrument, bool active, bool paused) external onlyOwner {
        configs[instrument].active = active;
        configs[instrument].paused = paused;
        emit InstrumentStatusUpdated(instrument, active, paused);
    }

    function getConfig(address instrument) external view returns (InstrumentConfig memory) {
        return configs[instrument];
    }
}
