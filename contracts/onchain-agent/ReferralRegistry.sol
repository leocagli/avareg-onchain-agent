// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./OnChainAgentCompliance.sol";
import "./ProductRegistry.sol";
import "./RiskOracle.sol";

contract ReferralRegistry {
    enum ReferralStatus {
        PENDING,
        ROUTED,
        REJECTED,
        COMPLETED
    }

    struct Referral {
        address investor;
        uint256 productId;
        address agent;
        address institution;
        bytes32 wavyReportHash;
        bytes32 disclosureHash;
        ReferralStatus status;
        string decisionReason;
    }

    address public owner;
    OnChainAgentCompliance public immutable compliance;
    ProductRegistry public immutable products;
    RiskOracle public immutable riskOracle;
    uint256 public nextReferralId;
    mapping(uint256 => Referral) private referrals;

    event ReferralCreated(uint256 indexed referralId, address indexed investor, uint256 indexed productId, ReferralStatus status, string reason);
    event ReferralStatusUpdated(uint256 indexed referralId, ReferralStatus status, string reason);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    constructor(OnChainAgentCompliance compliance_, ProductRegistry products_, RiskOracle riskOracle_) {
        owner = msg.sender;
        compliance = compliance_;
        products = products_;
        riskOracle = riskOracle_;
    }

    function createReferral(uint256 productId, address agent, bytes32 disclosureHash) external returns (uint256 referralId) {
        (OnChainAgentCompliance.Decision decision, string memory reason) = compliance.canInvest(msg.sender, productId);
        ProductRegistry.Product memory product = products.getProduct(productId);
        RiskOracle.RiskProfile memory risk = riskOracle.getRisk(msg.sender);

        ReferralStatus status = decision == OnChainAgentCompliance.Decision.ALLOW
            ? ReferralStatus.ROUTED
            : decision == OnChainAgentCompliance.Decision.REVIEW
                ? ReferralStatus.PENDING
                : ReferralStatus.REJECTED;

        referralId = nextReferralId++;
        referrals[referralId] = Referral({
            investor: msg.sender,
            productId: productId,
            agent: agent,
            institution: product.responsibleInstitution,
            wavyReportHash: risk.reportHash,
            disclosureHash: disclosureHash,
            status: status,
            decisionReason: reason
        });

        emit ReferralCreated(referralId, msg.sender, productId, status, reason);
    }

    function updateStatus(uint256 referralId, ReferralStatus status, string calldata reason) external onlyOwner {
        referrals[referralId].status = status;
        referrals[referralId].decisionReason = reason;
        emit ReferralStatusUpdated(referralId, status, reason);
    }

    function getReferral(uint256 referralId) external view returns (Referral memory) {
        return referrals[referralId];
    }
}
