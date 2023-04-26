// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2023 Qredo Ltd.

pragma solidity 0.8.13;

import "../interfaces/IQSign.sol";
import "./Context.sol";
import "./AccessControl.sol";
import "./Initializable.sol";
import "./Sign.sol";
import "../libraries/QSignTypes.sol";

contract QSign is Sign, IQSign {
    using QSignTypes for QSignTypes.ChainInfo;

    //****************************************************************** CONSTRUCTOR FUNCTION ******************************************************************/

    constructor() {
        _disableInitializers();
    }

    //****************************************************************** INIT FUNCTIONS ******************************************************************/

    function initializeV1() external initializer(){
        __QSign_init();
    }

    function __QSign_init() internal onlyInitializing() {
        __QSign_init_unchained();
        __Sign_init();
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function __QSign_init_unchained() internal onlyInitializing() {
    }

    //****************************************************************** EXTERNAL FUNCTIONS ******************************************************************/

    function walletTypeIdConfig(uint256 purpose, uint256 coinType, bool support) external virtual override onlyRole(DEFAULT_ADMIN_ROLE)  {
        QSignTypes.ChainInfo memory c = QSignTypes.ChainInfo(purpose, coinType);
        bytes32 walletTypeId = c.hashChainInfo();
        if(support){
            require(getChainInfo(walletTypeId).isNull(), "qs::supportWalletTypeId:walletTypeId is already supported");
            supportedWalletTypes[walletTypeId] = c;
        }else{
            require(supportedWalletTypes[walletTypeId].isNotNull(), "qs::supportWalletTypeId:walletTypeId is not supported");
            delete supportedWalletTypes[walletTypeId];
        }
        emit WalletTypeIdSupport(purpose, coinType, walletTypeId, support);
    }

    function chainIdConfig(bytes32 walletTypeId, string memory caip, bool support) external virtual override onlyRole(DEFAULT_ADMIN_ROLE) walletTypeGuard(walletTypeId) {
        bytes32 chainId = keccak256(abi.encodePacked(caip));
        if(support){
            require(supportedChainIds[walletTypeId][chainId] == false, "qs::chainIdConfig:chainId is already supported");
            supportedChainIds[walletTypeId][chainId] = true;
        }else{
            require(supportedChainIds[walletTypeId][chainId] == true, "qs::chainIdConfig:chainId is not supported");
            delete supportedChainIds[walletTypeId][chainId];
        }
        emit ChainIdSupport(walletTypeId, chainId, caip, support);
    }

    function setupFee(uint256 _fee) external virtual override onlyRole(DEFAULT_ADMIN_ROLE)  {
        emit FeeUpdate(fee, _fee);
        fee = _fee;
    }

    function withdrawFees() external virtual payable override onlyRole(DEFAULT_ADMIN_ROLE) {
        address payable sender = payable(_msgSender());
        uint256 amount = address(this).balance;
        sender.transfer(amount);
        emit FeeWithdraw(sender, amount);
    }
}