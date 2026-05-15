// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract InvestorRegistry {
    struct InvestorProfile {
        bytes32 country;
        bytes32 riskProfile;
        bytes32 investmentObjective;
        bytes32 suitabilityHash;
        bool kycApproved;
        bool active;
        uint64 updatedAt;
    }

    address public owner;
    mapping(address => InvestorProfile) private profiles;

    event InvestorProfileUpdated(address indexed investor, bytes32 country, bytes32 riskProfile, bool kycApproved);
    event KycStatusUpdated(address indexed investor, bool approved);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setInvestorProfile(
        address investor,
        bytes32 country,
        bytes32 riskProfile,
        bytes32 investmentObjective,
        bytes32 suitabilityHash,
        bool kycApproved,
        bool active
    ) external onlyOwner {
        require(investor != address(0), "INVALID_INVESTOR");
        profiles[investor] = InvestorProfile({
            country: country,
            riskProfile: riskProfile,
            investmentObjective: investmentObjective,
            suitabilityHash: suitabilityHash,
            kycApproved: kycApproved,
            active: active,
            updatedAt: uint64(block.timestamp)
        });
        emit InvestorProfileUpdated(investor, country, riskProfile, kycApproved);
    }

    function setKycStatus(address investor, bool approved) external onlyOwner {
        profiles[investor].kycApproved = approved;
        profiles[investor].updatedAt = uint64(block.timestamp);
        emit KycStatusUpdated(investor, approved);
    }

    function setSuitabilityHash(address investor, bytes32 suitabilityHash) external onlyOwner {
        profiles[investor].suitabilityHash = suitabilityHash;
        profiles[investor].updatedAt = uint64(block.timestamp);
        emit InvestorProfileUpdated(investor, profiles[investor].country, profiles[investor].riskProfile, profiles[investor].kycApproved);
    }

    function getInvestor(address investor) external view returns (InvestorProfile memory) {
        return profiles[investor];
    }
}
