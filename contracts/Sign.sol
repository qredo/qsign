// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2023 Qredo Ltd.

pragma solidity 0.8.13;

import "../interfaces/ISign.sol";
import "./Context.sol";
import "./AccessControl.sol";
import "./Initializable.sol";
import "../libraries/QSignTypes.sol";

abstract contract Sign is
    Context,
    AccessControl,
    Initializable,
    ISign
{
    using QSignTypes for QSignTypes.ChainInfo;

    bytes32 public constant MPC_ROLE = keccak256("qredo.role.mpc");

    uint256 internal fee;

    mapping(bytes32 => QSignTypes.ChainInfo) internal supportedWalletTypes; //keccak256(abi.encode(ChainInfo)) => ChainInfo
    mapping(bytes32 => mapping(bytes32 => bool)) internal supportedChainIds; //0 for chains without chainIds

    mapping(bytes32 => string[]) internal wallets;

    //****************************************************************** MODIFIERS ******************************************************************/

    modifier onlyMPC {
        require(
            hasRole(MPC_ROLE, _msgSender()) == true,
            "qs::onlyMPC:caller not authorized"
        );
        _;
    }

    modifier withFee {
        require(msg.value >= fee, "qs::withFee:msg.value should be greater");
        _;
    }

    modifier walletTypeGuard(bytes32 walletTypeId) {
        require(
            getChainInfo(walletTypeId).isNull() == false,
            "qs::walletTypeGuard:walletType not supported"
        );
        _;
    }

    modifier chainIdGuard(bytes32 walletTypeId, bytes32 chainId) {
        require(
            supportedChainIds[walletTypeId][chainId] == true,
            "qs::chainIdGuard:chainId not supported"
        );
        _;
    }

    modifier ownerGuard(address owner) {
        require(owner != address(0), "qs::ownerGuard:invalid owner address");
        _;
    }

    //****************************************************************** INIT FUNCTIONS ******************************************************************/

    function __Sign_init() internal onlyInitializing() {
        __Sign_init_unchained();
    }

    function __Sign_init_unchained() internal onlyInitializing() {}

    //****************************************************************** EXTERNAL FUNCTIONS ******************************************************************/

    function requestPublicKey(bytes32 walletTypeId)
        external
        virtual
        override
        payable
        withFee
        walletTypeGuard(walletTypeId)
    {
        bytes32 id = _getId(walletTypeId, _msgSender());
        emit RequestPublicKey(walletTypeId, _msgSender(), wallets[id].length);
    }

    function resolvePublicKey(
        bytes32 walletTypeId,
        address owner,
        uint256 publicKeyIndex,
        string memory publicKey
    )
        external
        virtual
        override
        onlyMPC
        walletTypeGuard(walletTypeId)
        ownerGuard(owner)
    {
        _validatePublicKey(publicKey);

        bytes32 id = _getId(walletTypeId, owner);
        require(wallets[id].length == publicKeyIndex, "qs::resolvePublicKey:incorrect publicKeyIndex");
        wallets[id].push(publicKey);

        emit ResolvePublicKey(
            walletTypeId,
            wallets[id].length - 1,
            owner,
            publicKey,
            _msgSender()
        );
    }

    function requestSignatureForHash(
        bytes32 walletTypeId,
        uint256 publicKeyIndex,
        bytes32 dstChainId,
        bytes32 payloadHash
    )
        external
        virtual
        override
        payable
        withFee
        walletTypeGuard(walletTypeId)
        chainIdGuard(walletTypeId, dstChainId)
    {
        bytes memory payload = abi.encodePacked(payloadHash);
        _requestSignature(
            walletTypeId,
            _msgSender(),
            publicKeyIndex,
            dstChainId,
            payload,
            true,
            false,
            false,
            false
        );
    }

    function requestSignatureForData(
        bytes32 walletTypeId,
        uint256 publicKeyIndex,
        bytes32 dstChainId,
        bytes memory payload
    )
        external
        virtual
        override
        payable
        withFee
        walletTypeGuard(walletTypeId)
        chainIdGuard(walletTypeId, dstChainId)
    {
        _requestSignature(
            walletTypeId,
            _msgSender(),
            publicKeyIndex,
            dstChainId,
            payload,
            false,
            true,
            false,
            false
        );
    }
    
    function requestSignatureForTransaction(
        bytes32 walletTypeId,
        uint256 publicKeyIndex,
        bytes32 dstChainId,
        bytes memory payload,
        bool broadcast
    )
        external
        virtual
        override
        payable
        withFee
        walletTypeGuard(walletTypeId)
        chainIdGuard(walletTypeId, dstChainId)
    {
        _requestSignature(
            walletTypeId,
            _msgSender(),
            publicKeyIndex,
            dstChainId,
            payload,
            false,
            false,
            true,
            broadcast
        );
    }

    function _requestSignature(
        bytes32 walletTypeId,
        address owner,
        uint256 publicKeyIndex,
        bytes32 dstChainId,
        bytes memory payload,
        bool isHash,
        bool isData,
        bool isTransaction,
        bool broadcast
    ) internal virtual {
        string memory publicKey = wallets[_getId(
            walletTypeId,
            owner
        )][publicKeyIndex];
        _validatePublicKey(publicKey);
        emit RequestSignature(
            walletTypeId,
            owner,
            publicKeyIndex,
            dstChainId,
            payload,
            isHash,
            isData,
            isTransaction,
            broadcast
        );
    }

    function resolveSignature(
        bytes32 walletTypeId,
        address owner,
        uint256 publicKeyIndex,
        bytes32 dstChainId,
        bytes memory payload,
        bytes calldata signature,
        bool broadcast
    )
        external
        virtual
        override
        onlyMPC
        walletTypeGuard(walletTypeId)
        chainIdGuard(walletTypeId, dstChainId) 
        ownerGuard(owner)
    {
        _resolveSignature(
            walletTypeId,
            owner,
            publicKeyIndex,
            dstChainId,
            payload,
            signature,
            broadcast
        );
    }

    function _resolveSignature(
        bytes32 walletTypeId,
        address owner,
        uint256 publicKeyIndex,
        bytes32 dstChainId,
        bytes memory payload,
        bytes calldata signature,
        bool broadcast
    ) internal virtual {
        string memory publicKey = wallets[_getId(
            walletTypeId,
            owner
        )][publicKeyIndex];
        _validatePublicKey(publicKey);
        emit ResolveSignature(
            walletTypeId,
            owner,
            publicKeyIndex,
            dstChainId,
            payload,
            signature,
            broadcast
        );
    }

    //****************************************************************** VIEW EXTERNAL FUNCTIONS ******************************************************************/

    function getFee() external virtual override view returns (uint256) {
        return fee;
    }

    function getWallets(bytes32 walletTypeId, address owner)
        external
        virtual
        view
        returns (string[] memory)
    {
        return _getWallets(walletTypeId, owner);
    }

    function getWalletByIndex(
        bytes32 walletTypeId,
        address owner,
        uint256 index
    ) external virtual view returns (string memory) {
        return _getWalletByIndex(walletTypeId, owner, index);
    }

    function version() external virtual override view returns (uint256) {
        return _getInitializedVersion();
    }

    //****************************************************************** VIEW PUBLIC FUNCTIONS ******************************************************************/

    function getChainInfo(bytes32 walletTypeId)
        public
        virtual
        view
        returns (QSignTypes.ChainInfo memory)
    {
        return supportedWalletTypes[walletTypeId];
    }

    function isWalletTypeSupported(bytes32 walletTypeId)
        public
        virtual
        override
        view
        returns (bool)
    {
        return supportedWalletTypes[walletTypeId].isNotNull();
    }

    function isChainIdSupported(bytes32 walletTypeId, bytes32 chainId)
        public
        virtual
        override
        view
        returns (bool)
    {
        return supportedChainIds[walletTypeId][chainId];
    }

    //****************************************************************** INTERNAL VIEW FUNCTIONS ******************************************************************/

    function _getWalletByIndex(
        bytes32 walletTypeId,
        address owner,
        uint256 index
    ) internal virtual view returns (string memory) {
        bytes32 id = _getId(walletTypeId, owner);
        return wallets[id][index];
    }

    function _getWallets(bytes32 walletTypeId, address owner)
        internal
        virtual
        view
        returns (string[] memory)
    {
        bytes32 id = _getId(walletTypeId, owner);
        return wallets[id];
    }

    //****************************************************************** INTERNAL PURE FUNCTIONS ******************************************************************/

    function _getId(bytes32 walletTypeId, address owner)
        internal
        virtual
        pure
        returns (bytes32 id)
    {
        return keccak256(abi.encode(walletTypeId, owner));
    }

    function _validatePublicKey(string memory publicKey) internal virtual pure {
        require(
            abi.encodePacked(publicKey).length > 0,
            "qs::validatePublicKey:incorrect public key"
        );
    }
}
