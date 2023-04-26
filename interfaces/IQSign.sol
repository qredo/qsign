// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2023 Qredo Ltd.

pragma solidity 0.8.13;

import "./ISign.sol";

interface IQSign is ISign {
    function initializeV1() external;

    function walletTypeIdConfig(
        uint256 purpose,
        uint256 coinType,
        bool support
    ) external;

    function chainIdConfig(
        bytes32 walletTypeId,
        string memory caip,
        bool support
    ) external;

    function setupFee(uint256 _fee) external;

    function withdrawFees() external payable;

    event FeeUpdate(uint256 indexed oldFee, uint256 indexed newFee);
    event FeeWithdraw(address indexed to, uint256 indexed amount);

    event WalletTypeIdSupport(
        uint256 indexed purpose,
        uint256 indexed coinType,
        bytes32 indexed walletTypeId,
        bool support
    );
    event ChainIdSupport(
        bytes32 indexed walletTypeId,
        bytes32 indexed chainId,
        string caip,
        bool support
    );
}
