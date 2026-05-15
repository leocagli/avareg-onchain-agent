// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ProductRegistry {
    enum ProductStatus {
        DRAFT,
        ACTIVE,
        PAUSED,
        CLOSED
    }

    struct Product {
        bytes32 country;
        bytes32 productType;
        address responsibleInstitution;
        bytes32 documentHash;
        uint8 minimumRiskLevel;
        uint8 maximumWavyScore;
        bool requiresKyc;
        ProductStatus status;
        string name;
    }

    address public owner;
    uint256 public nextProductId;
    mapping(uint256 => Product) private products;

    event ProductCreated(uint256 indexed productId, bytes32 country, bytes32 productType, address indexed institution, string name);
    event ProductRestrictionsUpdated(uint256 indexed productId, uint8 minimumRiskLevel, uint8 maximumWavyScore, bool requiresKyc);
    event ProductStatusUpdated(uint256 indexed productId, ProductStatus status);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createProduct(
        bytes32 country,
        bytes32 productType,
        address responsibleInstitution,
        bytes32 documentHash,
        uint8 minimumRiskLevel,
        uint8 maximumWavyScore,
        bool requiresKyc,
        string calldata name
    ) external onlyOwner returns (uint256 productId) {
        require(responsibleInstitution != address(0), "INVALID_INSTITUTION");
        productId = nextProductId++;
        products[productId] = Product({
            country: country,
            productType: productType,
            responsibleInstitution: responsibleInstitution,
            documentHash: documentHash,
            minimumRiskLevel: minimumRiskLevel,
            maximumWavyScore: maximumWavyScore,
            requiresKyc: requiresKyc,
            status: ProductStatus.ACTIVE,
            name: name
        });
        emit ProductCreated(productId, country, productType, responsibleInstitution, name);
    }

    function setRestrictions(uint256 productId, uint8 minimumRiskLevel, uint8 maximumWavyScore, bool requiresKyc) external onlyOwner {
        products[productId].minimumRiskLevel = minimumRiskLevel;
        products[productId].maximumWavyScore = maximumWavyScore;
        products[productId].requiresKyc = requiresKyc;
        emit ProductRestrictionsUpdated(productId, minimumRiskLevel, maximumWavyScore, requiresKyc);
    }

    function setResponsibleInstitution(uint256 productId, address institution) external onlyOwner {
        require(institution != address(0), "INVALID_INSTITUTION");
        products[productId].responsibleInstitution = institution;
    }

    function setStatus(uint256 productId, ProductStatus status) external onlyOwner {
        products[productId].status = status;
        emit ProductStatusUpdated(productId, status);
    }

    function getProduct(uint256 productId) external view returns (Product memory) {
        return products[productId];
    }
}
