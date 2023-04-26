const { assert } = require("chai");
const helpers = require("./helpers");
const RLP = require("rlp");
const {
  UNSUPPORTED_CHAIN_TYPE,
  EVM_CHAIN_TYPE,
  EVM_CHAIN_TYPE_HASH,
  UNSUPPORTED_CHAIN_TYPE_HASH,
} = require("./helpers");

contract("QSign integration tests", (accounts) => {
  const owner = accounts[0];
  const proxyAdmin = accounts[9];
  const regularAddress = accounts[1];
  const regularAddress1 = accounts[7];
  const ovmAddress = accounts[2];
  const FAKE_EVM_MPC_ADDRESS = accounts[8];
  const FAKE_BTC_TESTNET_MPC_ADDRESS = "mqkWyJnZk7W4w36LVApASLv3SaCgZ1eaua";
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  let instances;

  before(async () => {
    instances = await helpers.initQSignWithProxy(proxyAdmin, owner);
  });

  describe("setup fee", async () => {
    let positiveSetupFeeTests = [
      {
        testName: "setup fee",
        fee: web3.utils.toWei("30", "gwei"),
        caller: owner,
      },
      {
        testName: "change fee",
        fee: web3.utils.toWei("80", "gwei"),
        caller: owner,
      },
    ];

    for (let c of positiveSetupFeeTests) {
      it(`shoud ${c.testName}`, async () => {
        //Given
        let oldFee;
        let updatedFee;
        let tx;

        //When
        oldFee = await helpers.getFee(instances.proxied);
        tx = await helpers.setupFee(c.fee, c.caller, instances.proxied);
        updatedFee = await helpers.getFee(instances.proxied);

        //Then
        await helpers.expectTXSuccess(tx);
        await helpers.checkFeeEvent(tx.receipt.logs[0], oldFee, c.fee);
        assert.equal(
          updatedFee,
          c.fee,
          `Contract state not updated correctly. Transaction: ${tx.tx}`
        );
      });
    }
  });

  describe("access control", async () => {
    let positiveAccessControlTests = [
      {
        testName: "grant OVM address to OVM role",
        role: helpers.MPC_ROLE,
        account: ovmAddress,
        caller: owner,
      },
      {
        testName: "grant regular address to OVM role",
        role: helpers.MPC_ROLE,
        account: regularAddress,
        caller: owner,
      },
      {
        testName: "grant regular address 1 to OVM role",
        role: helpers.MPC_ROLE,
        account: regularAddress1,
        caller: owner,
      },
    ];

    for (let c of positiveAccessControlTests) {
      it(`shoud ${c.testName}`, async () => {
        //Given
        let hasRoleBefore;
        let hasRoleAfter;
        let tx;

        //When
        hasRoleBefore = await helpers.hasRole(
          c.role,
          c.account,
          instances.proxied
        );
        tx = await helpers.grantRole(
          c.role,
          c.account,
          c.caller,
          instances.proxied
        );
        hasRoleAfter = await helpers.hasRole(
          c.role,
          c.account,
          instances.proxied
        );

        //Then
        await helpers.expectTXSuccess(tx);
        await helpers.checkGrandRoleEvent(
          tx.receipt.logs[0],
          c.role,
          c.account,
          c.caller
        );
        assert.notEqual(
          hasRoleBefore,
          hasRoleAfter,
          `Contract state not updated correctly. Role ${c.role} was not assigned to account ${c.account}. Transaction: ${tx.tx}`
        );
      });
    }

    it("should revoke regular address OVM role", async () => {
      //Given
      let hasRoleBefore;
      let hasRoleAfter;
      let tx;

      //When
      hasRoleBefore = await helpers.hasRole(
        helpers.MPC_ROLE,
        regularAddress,
        instances.proxied
      );
      tx = await helpers.revokeRole(
        helpers.MPC_ROLE,
        regularAddress,
        owner,
        instances.proxied
      );
      hasRoleAfter = await helpers.hasRole(
        helpers.MPC_ROLE,
        regularAddress,
        instances.proxied
      );

      //Then
      await helpers.expectTXSuccess(tx);
      await helpers.checkRevokeRoleEvent(
        tx.receipt.logs[0],
        helpers.MPC_ROLE,
        regularAddress,
        owner
      );
      assert.notEqual(
        hasRoleBefore,
        hasRoleAfter,
        `Contract state not updated correctly. Role ${helpers.MPC_ROLE} was not revoked from account ${regularAddress}. Transaction: ${tx.tx}`
      );
    });

    it("should not renounce OVM role if account not sender", async () => {
      //Given
      const expectedError = "AccessControl: can only renounce roles for self";
      let hasRoleBefore;
      let hasRoleAfter;
      let tx;

      //When
      hasRoleBefore = await helpers.hasRole(
        helpers.MPC_ROLE,
        regularAddress1,
        instances.proxied
      );
      tx = helpers.renounceRole(
        helpers.MPC_ROLE,
        regularAddress1,
        regularAddress,
        instances.proxied
      );
      hasRoleAfter = await helpers.hasRole(
        helpers.MPC_ROLE,
        regularAddress1,
        instances.proxied
      );

      //Then
      await helpers.expectRevert(tx, expectedError);
      assert.equal(
        hasRoleBefore,
        hasRoleAfter,
        `Contract state not updated correctly. Role ${helpers.MPC_ROLE} was revoked from account ${regularAddress}. Transaction: ${tx.tx}`
      );
    });

    it("should renounce OVM role", async () => {
      //Given
      let hasRoleBefore;
      let hasRoleAfter;
      let tx;

      //When
      hasRoleBefore = await helpers.hasRole(
        helpers.MPC_ROLE,
        regularAddress1,
        instances.proxied
      );
      tx = await helpers.renounceRole(
        helpers.MPC_ROLE,
        regularAddress1,
        regularAddress1,
        instances.proxied
      );
      hasRoleAfter = await helpers.hasRole(
        helpers.MPC_ROLE,
        regularAddress1,
        instances.proxied
      );

      //Then
      await helpers.expectTXSuccess(tx);
      await helpers.checkRevokeRoleEvent(
        tx.receipt.logs[0],
        helpers.MPC_ROLE,
        regularAddress1,
        regularAddress1
      );
      assert.notEqual(
        hasRoleBefore,
        hasRoleAfter,
        `Contract state not updated correctly. Role ${helpers.MPC_ROLE} was not revoked from account ${regularAddress}. Transaction: ${tx.tx}`
      );
    });

    let negativeAccessControlTests = [
      {
        testName: "grant role if has not admin role",
        role: helpers.MPC_ROLE,
        account: ovmAddress,
        caller: regularAddress,
      },
      {
        testName: "revoke role if has not admin role",
        role: helpers.MPC_ROLE,
        account: regularAddress,
        caller: regularAddress,
      },
    ];

    for (let c of negativeAccessControlTests) {
      it(`shoud not ${c.testName}`, async () => {
        //Given
        const expectedError = `AccessControl: account ${c.caller} is missing role ${helpers.DEFAULT_ADMIN_ROLE}`;

        let hasRoleBefore;
        let hasRoleAfter;
        let tx;

        //When
        hasRoleBefore = await helpers.hasRole(
          c.role,
          c.account,
          instances.proxied
        );
        tx = helpers.grantRole(c.role, c.account, c.caller, instances.proxied);
        hasRoleAfter = await helpers.hasRole(
          c.role,
          c.account,
          instances.proxied
        );

        //Then
        await helpers.expectRevert(tx, expectedError);
        assert.equal(
          hasRoleBefore,
          hasRoleAfter,
          `Contract state not updated correctly. Role ${c.role} was assigned to account ${c.account}. Transaction: ${tx.tx}`
        );
      });
    }
  });

  describe("wallet type config tests", async () => {
    let supportChainTypePositiveTestCases = [
      {
        testName: "support BTC wallet type chain type",
        walletType: helpers.BTC_CHAIN_TYPE,
        support: true,
        caller: owner,
      },
      {
        testName: "support BTC Testnet wallet type chain type",
        walletType: helpers.BTC_TESTNET_CHAIN_TYPE,
        support: true,
        caller: owner,
      },
      {
        testName: "support EVM wallet type",
        walletType: helpers.EVM_CHAIN_TYPE,
        support: true,
        caller: owner,
      },
    ];

    for (let c of supportChainTypePositiveTestCases) {
      it(`shoud ${c.testName}`, async () => {
        //Given
        const walletTypeIdPayload = web3.eth.abi.encodeParameters(
          ["uint256", "uint256"],
          [c.walletType.purpose, c.walletType.coinType]
        );
        const walletTypeId = web3.utils.keccak256(walletTypeIdPayload);
        let tx;
        //When
        tx = await helpers.walletTypeIdConfig(
          c.walletType.purpose,
          c.walletType.coinType,
          c.support,
          c.caller,
          instances.proxied
        );
        //Then
        await helpers.expectTXSuccess(tx);
        await helpers.assertWalletTypeSupport(
          walletTypeId,
          instances.proxied,
          c.support
        );
        await helpers.checkWalletTypeConfigEvent(
          tx.receipt.logs[0],
          c.walletType.purpose,
          c.walletType.coinType,
          walletTypeId,
          c.support
        );
      });
    }

    let removeSupportChainTypePositiveTestCases = [
      {
        testName: "remove support BTC_MAINNET wallet type",
        walletType: helpers.BTC_CHAIN_TYPE,
        support: false,
        caller: owner,
      },
    ];

    for (let c of removeSupportChainTypePositiveTestCases) {
      it(`shoud ${c.testName}`, async () => {
        //Given
        let tx;
        const walletTypeIdPayload = web3.eth.abi.encodeParameters(
          ["uint256", "uint256"],
          [c.walletType.purpose, c.walletType.coinType]
        );
        const walletTypeId = web3.utils.keccak256(walletTypeIdPayload);
        //When
        supportedBefore = await helpers.isWalletTypeSupported(
          walletTypeId,
          instances.proxied
        );
        tx = await helpers.walletTypeIdConfig(
          c.walletType.purpose,
          c.walletType.coinType,
          c.support,
          c.caller,
          instances.proxied
        );
        supportedAfter = await helpers.isWalletTypeSupported(
          walletTypeId,
          instances.proxied
        );
        //Then
        await helpers.expectTXSuccess(tx);
        await helpers.assertWalletTypeSupport(walletTypeId, instances.proxied);
        await helpers.checkWalletTypeConfigEvent(
          tx.receipt.logs[0],
          c.walletType.purpose,
          c.walletType.coinType,
          walletTypeId
        );
        assert.notEqual(supportedBefore, supportedAfter);
      });
    }

    let supportChainTypeNegativeTestCases = [
      {
        testName: "config chain type from account without role",
        walletType: helpers.BTC_TESTNET_CHAIN_TYPE,
        support: true,
        caller: regularAddress,
        expectedError: `AccessControl: account ${regularAddress} is missing role ${helpers.DEFAULT_ADMIN_ROLE}`,
      },
      {
        testName: "config support for already supported wallet type",
        walletType: helpers.BTC_TESTNET_CHAIN_TYPE,
        support: true,
        caller: owner,
        expectedError:
          "qs::supportWalletTypeId:walletTypeId is already supported",
      },
      {
        testName: "config remove support for already non supported wallet type",
        walletType: helpers.BTC_CHAIN_TYPE,
        support: false,
        caller: owner,
        expectedError: "qs::supportWalletTypeId:walletTypeId is not supported",
      },
    ];

    for (let c of supportChainTypeNegativeTestCases) {
      it(`shoud not ${c.testName}`, async () => {
        //Given
        const walletTypeIdPayload = web3.eth.abi.encodeParameters(
          ["uint256", "uint256"],
          [c.walletType.purpose, c.walletType.coinType]
        );
        const walletTypeId = web3.utils.keccak256(walletTypeIdPayload);
        let tx;
        let supportedBefore;
        let supportedAfter;
        //When
        supportedBefore = await helpers.isWalletTypeSupported(
          walletTypeId,
          instances.proxied
        );
        tx = helpers.walletTypeIdConfig(
          c.walletType.purpose,
          c.walletType.coinType,
          c.support,
          c.caller,
          instances.proxied
        );
        //Then
        await helpers.expectRevert(tx, c.expectedError);
        supportedAfter = await helpers.isWalletTypeSupported(
          walletTypeId,
          instances.proxied
        );
        assert.equal(supportedBefore, supportedAfter);
      });
    }
  });
  
  describe("chain id config tests", async () => {
    let supportChainIdPositiveTestCases = [
      {
        testName: "support BTC Testnet chain id",
        walletType: helpers.BTC_TESTNET_CHAIN_TYPE,
        chainId: helpers.BTC_TESTNET_CHAIN_ID,
        caip: helpers.BTC_TESTNET_CAIP,
        support: true,
        caller: owner,
      },
      {
        testName: "support ETH chain id",
        walletType: helpers.EVM_CHAIN_TYPE,
        chainId: helpers.ETH_CHAIN_ID,
        caip: helpers.ETH_CAIP,
        support: true,
        caller: owner,
      },
      {
        testName: "support Goerli chain id",
        walletType: helpers.EVM_CHAIN_TYPE,
        chainId: helpers.GOERLI_CHAIN_ID,
        caip: helpers.GOERLI_CAIP,
        support: true,
        caller: owner,
      },
      {
        testName: "support Matic Mumbai chain id",
        walletType: helpers.EVM_CHAIN_TYPE,
        chainId: helpers.MUMBAI_CHAIN_ID,
        caip: helpers.MUMBAI_CAIP,
        support: true,
        caller: owner,
      },
    ];

    for (let c of supportChainIdPositiveTestCases) {
      it(`shoud ${c.testName}`, async () => {
        //Given
        const walletTypeIdPayload = web3.eth.abi.encodeParameters(
          ["uint256", "uint256"],
          [c.walletType.purpose, c.walletType.coinType]
        );
        const walletTypeId = web3.utils.keccak256(walletTypeIdPayload);
        let tx;
        //When
        tx = await helpers.chainIdConfig(
          walletTypeId,
          c.caip,
          c.support,
          c.caller,
          instances.proxied
        );
        //Then
        await helpers.expectTXSuccess(tx);
        await helpers.assertChainIdSupport(
          walletTypeId,
          c.chainId,
          instances.proxied,
          c.support
        );
        await helpers.checkChainIdConfigEvent(
          tx.receipt.logs[0],
          walletTypeId,
          c.chainId,
          c.caip,
          c.support
        );
      });
    }

    let removeSupportChainIdPositiveTestCases = [
      {
        testName: "remove support BTC Testnet chain id",
        walletType: helpers.BTC_TESTNET_CHAIN_TYPE,
        chainId: helpers.BTC_TESTNET_CHAIN_ID,
        caip: helpers.BTC_TESTNET_CAIP,
        support: false,
        caller: owner,
      },
      {
        testName: "remove support ETH chain id",
        walletType: helpers.EVM_CHAIN_TYPE,
        chainId: helpers.ETH_CHAIN_ID,
        caip: helpers.ETH_CAIP,
        support: false,
        caller: owner,
      },
    ];

    for (let c of removeSupportChainIdPositiveTestCases) {
      it(`shoud ${c.testName}`, async () => {
        //Given
        const walletTypeIdPayload = web3.eth.abi.encodeParameters(
          ["uint256", "uint256"],
          [c.walletType.purpose, c.walletType.coinType]
        );
        const walletTypeId = web3.utils.keccak256(walletTypeIdPayload);
        let tx;
        //When
        tx = await helpers.chainIdConfig(
          walletTypeId,
          c.caip,
          c.support,
          c.caller,
          instances.proxied
        );
        //Then
        await helpers.expectTXSuccess(tx);
        await helpers.assertChainIdSupport(
          walletTypeId,
          c.chainId,
          instances.proxied,
          c.support
        );
        await helpers.checkChainIdConfigEvent(
          tx.receipt.logs[0],
          walletTypeId,
          c.chainId,
          c.caip,
          c.support
        );
      });
    }
  });

  describe("request public key", async () => {
    let requestPublicKeyPositiveTestCases = [
      {
        testName: "request public key for BTC TESTNET",
        walletType: helpers.BTC_TESTNET_CHAIN_TYPE,
        caller: regularAddress,
        fee: web3.utils.toWei("80", "gwei"),
      },
      {
        testName: "request public key for EVM",
        walletType: helpers.EVM_CHAIN_TYPE,
        caller: regularAddress,
        fee: web3.utils.toWei("80", "gwei"),
      },
    ];

    for (const c of requestPublicKeyPositiveTestCases) {
      it(`shoud ${c.testName}`, async () => {
        //Given
        const wt = c.walletType;
        const walletTypeIdPayload = web3.eth.abi.encodeParameters(
          ["uint256", "uint256"],
          [wt.purpose, wt.coinType]
        );
        const walletTypeId = web3.utils.keccak256(walletTypeIdPayload);
        let wallets;
        let tx;
        //When
        wallets = await helpers.getWallets(
          walletTypeId,
          c.caller,
          instances.proxied
        );

        tx = await helpers.requestPublicKey(
          walletTypeId,
          c.fee,
          c.caller,
          instances.proxied
        );
        //Then
        await helpers.expectTXSuccess(tx);
        await helpers.checkRequestPublicKeyEvent(
          tx.receipt.logs[0],
          walletTypeId,
          regularAddress,
          wallets.length
        );
      });
    }

    let negativeRequestPublicKeyTestCases = [
      {
        testName: "be able to request for unsupported walletType",
        walletTypeId: helpers.UNSUPPORTED_CHAIN_TYPE_HASH,
        caller: regularAddress,
        fee: web3.utils.toWei("80", "gwei"),
        expectedError: "qs::walletTypeGuard:walletType not supported",
      },
      {
        testName: "be able to request with less fee",
        walletTypeId: helpers.EVM_CHAIN_TYPE_HASH,
        caller: regularAddress,
        fee: web3.utils.toWei("30", "gwei"),
        expectedError: "qs::withFee:msg.value should be greater",
      },
    ];

    for (let c of negativeRequestPublicKeyTestCases) {
      it(`shoud not ${c.testName}`, async () => {
        //Given
        let tx;
        let walletsBefore;
        let walletsAfter;

        //When
        walletsBefore = await helpers.getWallets(
          c.walletTypeId,
          c.caller,
          instances.proxied
        );

        tx = helpers.requestPublicKey(
          c.walletTypeId,
          c.fee,
          c.caller,
          instances.proxied
        );
        //Then
        await helpers.expectRevert(tx, c.expectedError);
        walletsAfter = await helpers.getWallets(
          c.walletTypeId,
          c.caller,
          instances.proxied
        );
        assert.deepEqual(walletsAfter, walletsBefore);
      });
    }
  });

  describe("resolve public key", async () => {
    let resolvePublicKeyPositiveTestCases = [
      {
        testName: "resolve public key for BTC TESTNET",
        walletType: helpers.BTC_TESTNET_CHAIN_TYPE,
        owner: regularAddress,
        publicKeyIndex: 0,
        publicKey: FAKE_BTC_TESTNET_MPC_ADDRESS,
        caller: ovmAddress,
      },
      {
        testName: "resolve public key for EVM",
        walletType: helpers.EVM_CHAIN_TYPE,
        owner: regularAddress,
        publicKeyIndex: 0,
        publicKey: FAKE_EVM_MPC_ADDRESS,
        caller: ovmAddress,
      },
    ];

    for (const c of resolvePublicKeyPositiveTestCases) {
      it(`shoud ${c.testName}`, async () => {
        //Given
        const wt = c.walletType;
        const walletTypeIdPayload = web3.eth.abi.encodeParameters(
          ["uint256", "uint256"],
          [wt.purpose, wt.coinType]
        );
        const walletTypeId = web3.utils.keccak256(walletTypeIdPayload);

        let walletsBefore;
        let walletsAfter;
        let tx;
        //When
        walletsBefore = await helpers.getWallets(
          walletTypeId,
          c.owner,
          instances.proxied
        );
        tx = await helpers.resolvePublicKey(
          walletTypeId,
          c.owner,
          c.publicKeyIndex,
          c.publicKey,
          c.caller,
          instances.proxied
        );
        walletsAfter = await helpers.getWallets(
          walletTypeId,
          c.owner,
          instances.proxied
        );
        //Then
        await helpers.expectTXSuccess(tx);
        await helpers.checkResolvePublicKeyEvent(
          tx.receipt.logs[0],
          walletTypeId,
          walletsBefore.length,
          c.owner,
          c.publicKey,
          c.caller
        );
        assert.equal(
          walletsAfter.length,
          walletsBefore.length + 1,
          `public key not accepted by the contract at transaction: ${tx.tx}`
        );
      });
    }

    let negativeResolvePublicKeyTestCases = [
      {
        testName: "be able to resolve for unsupported chain type",
        walletType: helpers.UNSUPPORTED_CHAIN_TYPE,
        owner: regularAddress,
        publicKeyIndex: 0,
        mpcAddress: FAKE_BTC_TESTNET_MPC_ADDRESS,
        caller: ovmAddress,
        expectedError: "qs::walletTypeGuard:walletType not supported",
      },
      {
        testName: "be able to resolve zero address",
        walletType: helpers.BTC_TESTNET_CHAIN_TYPE,
        owner: zeroAddress,
        publicKeyIndex: 0,
        mpcAddress: FAKE_EVM_MPC_ADDRESS,
        caller: ovmAddress,
        expectedError: "qs::ownerGuard:invalid owner address",
      },
      {
        testName: "be able to resolve with incorrect public key",
        walletType: helpers.EVM_CHAIN_TYPE,
        owner: regularAddress,
        publicKeyIndex: 0,
        mpcAddress: "",
        caller: ovmAddress,
        expectedError: "qs::validatePublicKey:incorrect public key",
      },
      {
        testName: "be able to resolve without ovm role",
        walletType: helpers.EVM_CHAIN_TYPE,
        owner: regularAddress,
        publicKeyIndex: 0,
        mpcAddress: FAKE_EVM_MPC_ADDRESS,
        caller: owner,
        expectedError: "qs::onlyMPC:caller not authorized",
      },
      {
        testName: "be able to resolve with inccorect publicKeyIndex",
        walletType: helpers.EVM_CHAIN_TYPE,
        owner: regularAddress,
        publicKeyIndex: 6,
        mpcAddress: FAKE_EVM_MPC_ADDRESS,
        caller: owner,
        expectedError: "qs::onlyMPC:caller not authorized",
      },
      {
        testName: "be able to resolve with already resolved public key index",
        walletType: helpers.EVM_CHAIN_TYPE,
        owner: regularAddress,
        publicKeyIndex: 0,
        mpcAddress: FAKE_EVM_MPC_ADDRESS,
        caller: owner,
        expectedError: "qs::onlyMPC:caller not authorized",
      },
    ];

    for (let c of negativeResolvePublicKeyTestCases) {
      it(`shoud not ${c.testName}`, async () => {
        //Given
        const wt = c.walletType;
        const walletTypeIdPayload = web3.eth.abi.encodeParameters(
          ["uint256", "uint256"],
          [wt.purpose, wt.coinType]
        );
        const walletTypeId = web3.utils.keccak256(walletTypeIdPayload);

        let tx;
        let walletsBefore;
        let walletsAfter;
        //When
        walletsBefore = await helpers.getWallets(
          walletTypeId,
          c.owner,
          instances.proxied
        );
        tx = helpers.resolvePublicKey(
          walletTypeId,
          c.owner,
          c.publicKeyIndex,
          c.mpcAddress,
          c.caller,
          instances.proxied
        );
        //Then
        await helpers.expectRevert(tx, c.expectedError);
        walletsAfter = await helpers.getWallets(
          walletTypeId,
          c.owner,
          instances.proxied
        );
        assert.equal(walletsBefore.length, walletsAfter.length);
      });
    }
  });

  describe("request signature", async () => {
    let requestSignaturePositiveTestCases = [
      {
        testName: "request signature for payload hash without broadcast",
        walletTypeId: helpers.EVM_CHAIN_TYPE_HASH,
        publicKeyIndex: 0,
        fee: web3.utils.toWei("80", "gwei"),
        caller: regularAddress,
        isHash: true,
        isData: false,
        isTransaction: false,
        broadcast: false,
        dstChainId: helpers.GOERLI_CHAIN_ID,
      },
    ];
    for (const c of requestSignaturePositiveTestCases) {
      it(`shoud ${c.testName}`, async () => {
        //Given
        let tx;
        //When
        const nonce = await web3.eth.getTransactionCount(
          regularAddress,
          "latest"
        ); // nonce starts counting from 0

        const t = {
          to: owner,
          value: 100,
          gas: 30000,
          maxFeePerGas: 1000000108,
          nonce: nonce,
          data: "0x",
        };

        const transaction = [
          web3.utils.toHex(t.nonce),
          web3.utils.toHex(t.maxFeePerGas),
          web3.utils.toHex(t.gasLimit),
          t.to,
          web3.utils.toHex(t.value),
          t.data,
          null,
          null,
          null,
        ];

        const payload = RLP.encode(transaction);
        const payloadHash = web3.utils.soliditySha3(payload);

        
        tx = await helpers.requestSignatureForHash(
          c.walletTypeId,
          c.publicKeyIndex,
          c.dstChainId,
          payloadHash,
          c.fee,
          c.caller,
          instances.proxied
        );

        //Then
        await helpers.expectTXSuccess(tx);
        await helpers.checkRequestSignatureEvent(
          tx.receipt.logs[0],
          c.walletTypeId,
          c.caller,
          c.publicKeyIndex,
          c.dstChainId,
          payloadHash,
          c.isHash,
          c.isData,
          c.isTransaction,
          c.broadcast
        );
      });
    }

    let negativeRequestSignatureTests = [
      {
        testName: "be able to request for unsupported wallet type id",
        walletTypeId: helpers.UNSUPPORTED_CHAIN_TYPE_HASH,
        publicKeyIndex: 0,
        fee: web3.utils.toWei("80", "gwei"),
        caller: regularAddress,
        isHash: true,
        isData: false,
        isTransaction: false,
        broadcast: false,
        broadcast: false,
        dstChainId: helpers.GOERLI_CHAIN_ID,
        expectedError: "qs::walletTypeGuard:walletType not supported",
      },
      {
        testName: "be able to request with incorrect key index",
        walletTypeId: helpers.EVM_CHAIN_TYPE_HASH,
        publicKeyIndex: 5,
        fee: web3.utils.toWei("80", "gwei"),
        caller: regularAddress,
        isHash: true,
        isData: false,
        isTransaction: false,
        broadcast: false,
        dstChainId: helpers.GOERLI_CHAIN_ID,
        expectedError: "Index out of bounds",
      },
      {
        testName: "be able to request with less fee",
        walletTypeId: helpers.EVM_CHAIN_TYPE_HASH,
        publicKeyIndex: 0,
        fee: web3.utils.toWei("30", "gwei"),
        caller: regularAddress,
        isHash: true,
        isData: false,
        isTransaction: false,
        broadcast: false,
        dstChainId: helpers.GOERLI_CHAIN_ID,
        expectedError: "qs::withFee:msg.value should be greater",
      },
    ];

    for (let c of negativeRequestSignatureTests) {
      it(`shoud not ${c.testName}`, async () => {
        //Given
        let tx;

        //When
        const nonce = await web3.eth.getTransactionCount(
          regularAddress,
          "latest"
        ); // nonce starts counting from 0

        const t = {
          to: owner,
          value: 100,
          gas: 30000,
          maxFeePerGas: 1000000108,
          nonce: nonce,
          data: "0x",
        };

        const transaction = [
          web3.utils.toHex(t.nonce),
          web3.utils.toHex(t.maxFeePerGas),
          web3.utils.toHex(t.gasLimit),
          t.to,
          web3.utils.toHex(t.value),
          t.data,
          null,
          null,
          null,
        ];

        const payload = RLP.encode(transaction);
        const payloadHash = web3.utils.soliditySha3(payload);

        tx = helpers.requestSignatureForHash(
          c.walletTypeId,
          c.publicKeyIndex,
          c.dstChainId,
          payloadHash,
          c.fee,
          c.caller,
          instances.proxied
        );

        //Then
        await helpers.expectRevert(tx, c.expectedError);
      });
    }
  });

  describe("resolve signature", async () => {
    let resolveSignaturePositiveTestCases = [
      {
        testName: "resolve signature for payload hash without broadcast",
        walletTypeId: helpers.EVM_CHAIN_TYPE_HASH,
        publicKeyIndex: 0,
        fee: web3.utils.toWei("80", "gwei"),
        owner: regularAddress,
        caller: ovmAddress,
        dstChainId: helpers.GOERLI_CHAIN_ID,
      },
    ];
    for (const c of resolveSignaturePositiveTestCases) {
      it(`shoud ${c.testName}`, async () => {
        //Given
        const filter = {
          chainId: c.chainId,
          owner: c.owner,
          publicKeyIndex: c.publicKeyIndex,
        };

        let tx;
        //When
        const ev = await instances.proxied.getPastEvents("RequestSignature", {
          filter: filter,
          fromBlock: 0,
          toBlock: "latest",
        });
        const event = ev[0];
        const signature = await web3.eth.sign(
          event.args.payload,
          FAKE_EVM_MPC_ADDRESS
        );

        tx = await helpers.resolveSignature(
          event.args.walletTypeId,
          event.args.owner,
          event.args.publicKeyIndex,
          event.args.dstChainId,
          event.args.payload,
          signature,
          event.args.broadcast,
          c.caller,
          instances.proxied
        );

        //Then
        await helpers.expectTXSuccess(tx);
        await helpers.checkResolveSignatureEvent(
          tx.receipt.logs[0],
          event.args.walletTypeId,
          event.args.owner,
          event.args.publicKeyIndex,
          event.args.dstChainId,
          event.args.payload,
          signature
        );
      });
    }

    let negativeResolveSignatureTests = [
      {
        testName: "be able to resolve for unsupported wallet type id",
        walletTypeId: helpers.UNSUPPORTED_CHAIN_TYPE_HASH,
        owner: regularAddress,
        publicKeyIndex: 0,
        dstChainId: helpers.GOERLI_CHAIN_ID,
        broadcast: true,
        caller: ovmAddress,
        expectedError: "qs::walletTypeGuard:walletType not supported",
      },
      {
        testName: "be able to resolve for unsupported chain id",
        walletTypeId: helpers.EVM_CHAIN_TYPE_HASH,
        owner: regularAddress,
        publicKeyIndex: 0,
        dstChainId: helpers.UNSUPPORTED_CHAIN_ID,
        broadcast: true,
        caller: ovmAddress,
        expectedError: "qs::chainIdGuard:chainId not supported",
      },
      {
        testName: "be able to resolve with incorrect key index",
        walletTypeId: helpers.EVM_CHAIN_TYPE_HASH,
        owner: regularAddress,
        publicKeyIndex: 1,
        dstChainId: helpers.GOERLI_CHAIN_ID,
        broadcast: false,
        caller: ovmAddress,
        expectedError: "Index out of bounds",
      },
      {
        testName: "be able to resolve without ovm role",
        walletTypeId: helpers.EVM_CHAIN_TYPE_HASH,
        owner: regularAddress,
        publicKeyIndex: 0,
        dstChainId: helpers.GOERLI_CHAIN_ID,
        broadcast: false,
        caller: regularAddress,
        expectedError: "qs::onlyMPC:caller not authorized",
      },
    ];

    for (let c of negativeResolveSignatureTests) {
      it(`shoud not ${c.testName}`, async () => {
        //Given
        let tx;
        //When
        const nonce = await web3.eth.getTransactionCount(
          regularAddress,
          "latest"
        ); // nonce starts counting from 0

        const t = {
          to: owner,
          value: 100,
          gas: 30000,
          maxFeePerGas: 1000000108,
          nonce: nonce,
          data: "0x",
        };

        const transaction = [
          web3.utils.toHex(t.nonce),
          web3.utils.toHex(t.maxFeePerGas),
          web3.utils.toHex(t.gasLimit),
          t.to,
          web3.utils.toHex(t.value),
          t.data,
          null,
          null,
          null,
        ];

        const payload = RLP.encode(transaction);
        const payloadHash = web3.utils.soliditySha3(payload);
        const signature = await web3.eth.sign(
          payloadHash,
          FAKE_EVM_MPC_ADDRESS
        );
        const evBefore = await instances.proxied.getPastEvents(
          "ResolveSignature"
        );
        tx = helpers.resolveSignature(
          c.walletTypeId,
          c.owner,
          c.publicKeyIndex,
          c.dstChainId,
          payloadHash,
          signature,
          c.broadcast,
          c.caller,
          instances.proxied
        );

        //Then
        await helpers.expectRevert(tx, c.expectedError);
        const evAfter = await instances.proxied.getPastEvents(
          "ResolveSignature"
        );
        assert.deepEqual(
          evAfter,
          evBefore,
          "resolve signature event was emiited"
        );
      });
    }
  });
});
