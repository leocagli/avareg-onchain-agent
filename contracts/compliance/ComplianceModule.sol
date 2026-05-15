// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../registry/CNVRoleRegistry.sol";
import "../registry/KYCRegistry.sol";
import "../instruments/DigitalRepresentationRegistry.sol";

interface IRegulatedBalance {
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

contract ComplianceModule {
    CNVRoleRegistry public immutable roles;
    KYCRegistry public immutable kyc;
    DigitalRepresentationRegistry public immutable instruments;

    constructor(CNVRoleRegistry roles_, KYCRegistry kyc_, DigitalRepresentationRegistry instruments_) {
        roles = roles_;
        kyc = kyc_;
        instruments = instruments_;
    }

    function canTransfer(
        address instrument,
        address from,
        address to,
        uint256 amount
    ) external view returns (bool allowed, string memory reason) {
        DigitalRepresentationRegistry.InstrumentConfig memory config = instruments.getConfig(instrument);

        if (!config.active) return (false, "INSTRUMENT_NOT_ACTIVE");
        if (config.paused) return (false, "INSTRUMENT_PAUSED");
        if (!roles.hasActiveRole(config.issuer, CNVRoleRegistry.CNVRole.ISSUER)) return (false, "ISSUER_ROLE_MISSING");
        if (!roles.hasActiveRole(config.trdEntity, CNVRoleRegistry.CNVRole.TRD_ENTITY)) return (false, "TRD_ROLE_MISSING");
        if (!roles.hasActiveRole(config.psav, CNVRoleRegistry.CNVRole.PSAV)) return (false, "PSAV_ROLE_MISSING");
        if (to == address(0)) return (false, "INVALID_RECEIVER");
        if (kyc.frozenWallet(to) || kyc.blacklistedWallet(to)) return (false, "RECEIVER_RESTRICTED");

        if (from != address(0)) {
            if (kyc.frozenWallet(from) || kyc.blacklistedWallet(from)) return (false, "SENDER_RESTRICTED");
            if (block.timestamp < config.lockupUntil) return (false, "LOCKUP_ACTIVE");
        }

        if (!kyc.isVerified(to, config.minimumKYCLevel)) return (false, "RECEIVER_NOT_VERIFIED");

        KYCRegistry.KYCRecord memory receiver = kyc.getKYC(to);
        if (config.allowedJurisdiction != bytes32(0) && receiver.jurisdiction != config.allowedJurisdiction) {
            return (false, "JURISDICTION_NOT_ALLOWED");
        }

        if (config.maxHoldingBps > 0) {
            uint256 projected = IRegulatedBalance(instrument).balanceOf(to) + amount;
            uint256 supply = IRegulatedBalance(instrument).totalSupply();
            uint256 denominator = supply == 0 ? amount : supply;
            if (projected * 10_000 > denominator * config.maxHoldingBps) {
                return (false, "MAX_HOLDING_EXCEEDED");
            }
        }

        return (true, "APPROVED");
    }
}
