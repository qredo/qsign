// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2023 Qredo Ltd.

pragma solidity 0.8.13;

import "./IAccessControl.sol";
import "../libraries/QSignTypes.sol";

interface ISign is IAccessControl {
    function requestPublicKey(bytes32 walletTypeId) external payable;

    function resolvePublicKey(
        bytes32 walletTypeId,
        address owner,
        uint256 publicKeyIndex,
        string memory publicKey
    ) external;

    function requestSignatureForHash(
        bytes32 walletTypeId,
        uint256 publicKeyIndex,
        bytes32 dstChainId,
        bytes32 payloadHash
    ) external payable;

    function requestSignatureForData(
        bytes32 walletTypeId,
        uint256 publicKeyIndex,
        bytes32 dstChainId,
        bytes memory payload
    )external payable;

    function requestSignatureForTransaction(
        bytes32 walletTypeId,
        uint256 publicKeyIndex,
        bytes32 dstChainId,
        bytes memory payload,
        bool broadcast
    )external payable;

    function resolveSignature(
        bytes32 walletTypeId,
        address owner,
        uint256 publicKeyIndex,
        bytes32 dstChainId,
        bytes memory payload,
        bytes calldata signature,
        bool broadcast
    ) external;

    function version() external view returns (uint256);

    function isWalletTypeSupported(bytes32 walletTypeId)
        external
        view
        returns (bool);

    function isChainIdSupported(bytes32 walletTypeId, bytes32 chainId)
        external
        view
        returns (bool);

    function getFee() external returns (uint256);

    function getChainInfo(bytes32 walletTypeId)
        external
        view
        returns (QSignTypes.ChainInfo memory);

    function getWallets(bytes32 walletTypeId, address owner)
        external
        view
        returns (string[] memory);

    function getWalletByIndex(
        bytes32 walletTypeId,
        address owner,
        uint256 index
    ) external view returns (string memory);

    event RequestPublicKey(
        bytes32 indexed walletTypeId,
        address indexed owner,
        uint256 indexed walletIndex
    );

    event ResolvePublicKey(
        bytes32 indexed walletTypeId,
        uint256 indexed publicKeyIndex,
        address indexed owner,
        string publicKey,
        address ovm
    );

    event RequestSignature(
        bytes32 indexed walletTypeId,
        address indexed owner,
        uint256 indexed publicKeyIndex,
        bytes32 dstChainId,
        bytes payload,
        bool isHash,
        bool isData,
        bool isTransaction,
        bool broadcast
    );

    event ResolveSignature(
        bytes32 indexed walletTypeId,
        address indexed owner,
        uint256 indexed publicKeyIndex,
        bytes32 dstChainId,
        bytes payload,
        bytes signature,
        bool broadcast
    );
}
