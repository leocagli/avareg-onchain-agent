// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract EvidenceLog {
    address public owner;
    mapping(address => bool) public writer;

    event EvidenceRecorded(
        address indexed actor,
        address indexed instrument,
        address indexed wallet,
        bool approved,
        string reason,
        bytes32 evidenceHash
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    modifier onlyWriter() {
        require(writer[msg.sender] || msg.sender == owner, "ONLY_WRITER");
        _;
    }

    constructor() {
        owner = msg.sender;
        writer[msg.sender] = true;
    }

    function setWriter(address account, bool allowed) external onlyOwner {
        writer[account] = allowed;
    }

    function record(
        address instrument,
        address wallet,
        bool approved,
        string calldata reason,
        bytes32 evidenceHash
    ) external onlyWriter {
        emit EvidenceRecorded(msg.sender, instrument, wallet, approved, reason, evidenceHash);
    }
}
