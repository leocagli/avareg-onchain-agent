// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../instruments/RegulatedInstrument.sol";
import "../mocks/MockUSDC.sol";
import "../compliance/EvidenceLog.sol";

contract PermissionedSecondaryTransfer {
    struct SellOrder {
        address seller;
        uint256 tokenAmount;
        uint256 price;
        bool active;
    }

    address public owner;
    RegulatedInstrument public instrument;
    MockUSDC public paymentToken;
    EvidenceLog public evidenceLog;
    uint256 public nextOrderId;
    mapping(uint256 => SellOrder) public orders;

    event SellOrderCreated(uint256 indexed orderId, address indexed seller, uint256 tokenAmount, uint256 price);
    event SellOrderCancelled(uint256 indexed orderId);
    event SellOrderAccepted(uint256 indexed orderId, address indexed buyer, address indexed seller);

    constructor(RegulatedInstrument instrument_, MockUSDC paymentToken_, EvidenceLog evidenceLog_) {
        owner = msg.sender;
        instrument = instrument_;
        paymentToken = paymentToken_;
        evidenceLog = evidenceLog_;
    }

    function createSellOrder(uint256 tokenAmount, uint256 price) external returns (uint256 orderId) {
        require(tokenAmount > 0, "INVALID_AMOUNT");
        require(price > 0, "INVALID_PRICE");
        require(instrument.balanceOf(msg.sender) >= tokenAmount, "INSUFFICIENT_BALANCE");
        orderId = nextOrderId++;
        orders[orderId] = SellOrder(msg.sender, tokenAmount, price, true);
        emit SellOrderCreated(orderId, msg.sender, tokenAmount, price);
    }

    function cancelOrder(uint256 orderId) external {
        SellOrder storage order = orders[orderId];
        require(order.seller == msg.sender, "ONLY_SELLER");
        require(order.active, "ORDER_INACTIVE");
        order.active = false;
        emit SellOrderCancelled(orderId);
    }

    function acceptOrder(uint256 orderId) external {
        SellOrder storage order = orders[orderId];
        require(order.active, "ORDER_INACTIVE");
        order.active = false;
        paymentToken.transferFrom(msg.sender, order.seller, order.price);
        instrument.transferFrom(order.seller, msg.sender, order.tokenAmount);
        evidenceLog.record(address(instrument), msg.sender, true, "SECONDARY_TRANSFER_SETTLED", keccak256(abi.encode(orderId)));
        emit SellOrderAccepted(orderId, msg.sender, order.seller);
    }
}
