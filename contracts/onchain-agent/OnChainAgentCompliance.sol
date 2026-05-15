// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./InvestorRegistry.sol";
import "./InstitutionRegistry.sol";
import "./ProductRegistry.sol";
import "./RiskOracle.sol";

contract OnChainAgentCompliance {
    enum Decision {
        ALLOW,
        REVIEW,
        BLOCK
    }

    InvestorRegistry public immutable investors;
    InstitutionRegistry public immutable institutions;
    ProductRegistry public immutable products;
    RiskOracle public immutable riskOracle;

    constructor(
        InvestorRegistry investors_,
        InstitutionRegistry institutions_,
        ProductRegistry products_,
        RiskOracle riskOracle_
    ) {
        investors = investors_;
        institutions = institutions_;
        products = products_;
        riskOracle = riskOracle_;
    }

    function canInvest(address investor, uint256 productId) public view returns (Decision decision, string memory reason) {
        InvestorRegistry.InvestorProfile memory investorProfile = investors.getInvestor(investor);
        ProductRegistry.Product memory product = products.getProduct(productId);
        InstitutionRegistry.Institution memory institution = institutions.getInstitution(product.responsibleInstitution);
        RiskOracle.RiskProfile memory risk = riskOracle.getRisk(investor);

        if (product.status != ProductRegistry.ProductStatus.ACTIVE) return (Decision.BLOCK, "PRODUCT_NOT_ACTIVE");
        if (!institution.active) return (Decision.BLOCK, "INSTITUTION_NOT_ACTIVE");
        if (!investorProfile.active) return (Decision.BLOCK, "INVESTOR_NOT_ACTIVE");
        if (product.requiresKyc && !investorProfile.kycApproved) return (Decision.BLOCK, "KYC_REQUIRED");
        if (investorProfile.country != product.country) return (Decision.BLOCK, "COUNTRY_MISMATCH");
        if (risk.updatedAt == 0) return (Decision.REVIEW, "WAVY_SCORE_MISSING");
        if (risk.suspiciousActivity) return (Decision.BLOCK, "SUSPICIOUS_ACTIVITY");
        if (risk.score > product.maximumWavyScore) return (Decision.BLOCK, "WAVY_SCORE_TOO_HIGH");
        if (risk.level == RiskOracle.RiskLevel.MEDIUM) return (Decision.REVIEW, "MANUAL_REVIEW_REQUIRED");
        if (risk.level == RiskOracle.RiskLevel.HIGH || risk.level == RiskOracle.RiskLevel.CRITICAL) return (Decision.BLOCK, "RISK_LEVEL_BLOCKED");

        return (Decision.ALLOW, "ELIGIBLE");
    }

    function canTransfer(address seller, address buyer, uint256 productId) external view returns (Decision decision, string memory reason) {
        (Decision sellerDecision, string memory sellerReason) = canInvest(seller, productId);
        if (sellerDecision == Decision.BLOCK) return (Decision.BLOCK, sellerReason);

        (Decision buyerDecision, string memory buyerReason) = canInvest(buyer, productId);
        return (buyerDecision, buyerReason);
    }
}
