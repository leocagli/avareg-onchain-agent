// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../instruments/RegulatedInstrument.sol";
import "../mocks/MockUSDC.sol";
import "../compliance/EvidenceLog.sol";

contract PrimaryDistribution {
    address public owner;
    RegulatedInstrument public instrument;
    MockUSDC public paymentToken;
    EvidenceLog public evidenceLog;
    uint256 public pricePerToken; // USDC 6 decimals per instrument token unit.

    event SubscriptionRequested(address indexed investor, uint256 tokenAmount, uint256 paymentAmount);
    event AllocationApproved(address indexed investor, uint256 tokenAmount);
    event InstrumentMinted(address indexed investor, uint256 tokenAmount, uint256 paymentAmount);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    constructor(RegulatedInstrument instrument_, MockUSDC paymentToken_, EvidenceLog evidenceLog_, uint256 pricePerToken_) {
        owner = msg.sender;
        instrument = instrument_;
        paymentToken = paymentToken_;
        evidenceLog = evidenceLog_;
        pricePerToken = pricePerToken_;
    }

    function subscribe(uint256 tokenAmount, bytes32 evidenceHash) external {
        require(tokenAmount > 0, "INVALID_AMOUNT");
        uint256 paymentAmount = (tokenAmount * pricePerToken) / 1e18;
        emit SubscriptionRequested(msg.sender, tokenAmount, paymentAmount);
        paymentToken.transferFrom(msg.sender, owner, paymentAmount);
        instrument.mint(msg.sender, tokenAmount, evidenceHash);
        emit AllocationApproved(msg.sender, tokenAmount);
        emit InstrumentMinted(msg.sender, tokenAmount, paymentAmount);
        evidenceLog.record(address(instrument), msg.sender, true, "PRIMARY_SUBSCRIPTION_SETTLED", evidenceHash);
    }
}
