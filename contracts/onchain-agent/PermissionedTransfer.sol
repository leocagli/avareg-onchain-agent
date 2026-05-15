// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./OnChainAgentCompliance.sol";
import "./TokenizedInstrument.sol";

contract PermissionedTransfer {
    struct TransferRequest {
        address seller;
        address buyer;
        uint256 productId;
        uint256 amount;
        bool executed;
        bool blocked;
        string reason;
    }

    address public owner;
    OnChainAgentCompliance public immutable compliance;
    TokenizedInstrument public immutable instrument;
    uint256 public nextTransferId;
    mapping(uint256 => TransferRequest) private transfers;

    event TransferRequested(uint256 indexed transferId, address indexed seller, address indexed buyer, uint256 productId, uint256 amount);
    event TransferExecuted(uint256 indexed transferId, string reason);
    event TransferBlocked(uint256 indexed transferId, string reason);

    constructor(OnChainAgentCompliance compliance_, TokenizedInstrument instrument_) {
        owner = msg.sender;
        compliance = compliance_;
        instrument = instrument_;
    }

    function requestTransfer(address buyer, uint256 productId, uint256 amount) external returns (uint256 transferId) {
        transferId = nextTransferId++;
        transfers[transferId] = TransferRequest({
            seller: msg.sender,
            buyer: buyer,
            productId: productId,
            amount: amount,
            executed: false,
            blocked: false,
            reason: "REQUESTED"
        });
        emit TransferRequested(transferId, msg.sender, buyer, productId, amount);
    }

    function executeTransfer(uint256 transferId) external {
        TransferRequest storage transferRequest = transfers[transferId];
        require(!transferRequest.executed && !transferRequest.blocked, "TRANSFER_CLOSED");
        (OnChainAgentCompliance.Decision decision, string memory reason) = compliance.canTransfer(
            transferRequest.seller,
            transferRequest.buyer,
            transferRequest.productId
        );

        if (decision != OnChainAgentCompliance.Decision.ALLOW) {
            transferRequest.blocked = true;
            transferRequest.reason = reason;
            emit TransferBlocked(transferId, reason);
            return;
        }

        transferRequest.executed = true;
        transferRequest.reason = reason;
        instrument.moveDemoPosition(transferRequest.seller, transferRequest.buyer, transferRequest.amount);
        emit TransferExecuted(transferId, reason);
    }

    function getTransfer(uint256 transferId) external view returns (TransferRequest memory) {
        return transfers[transferId];
    }
}
