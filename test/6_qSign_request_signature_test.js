const { assert } = require("chai");
const helpers = require("./helpers");
const RLP = require("rlp");

contract("QSign request signature tests", (accounts) => {
  const owner = accounts[0];
  const proxyAdmin = accounts[9];
  const regularAddress = accounts[1];
  const ovmAddress = accounts[2];
  const fakeMPCAddress = accounts[8];

  const supportedWalletTypeId = helpers.EVM_CHAIN_TYPE_HASH;
  const unsupportedWalletTypeId = helpers.UNSUPPORTED_CHAIN_TYPE_HASH;

  const fee = web3.utils.toWei("80", "gwei");
  let instances;

  beforeEach(async () => {
    instances = await helpers.initQSignWithProxy(proxyAdmin, owner);
    const pki = 0;

    const wt = helpers.EVM_CHAIN_TYPE;
    const walletTypeIdPayload = web3.eth.abi.encodeParameters(
      ["uint256", "uint256"],
      [wt.purpose, wt.coinType]
    );
    const walletTypeId = web3.utils.keccak256(walletTypeIdPayload);

    const support = true;
    const caller = owner;

    await helpers.walletTypeIdConfig(
      wt.purpose,
      wt.coinType,
      support,
      caller,
      instances.proxied
    );
    await helpers.chainIdConfig(
      walletTypeId,
      helpers.GOERLI_CAIP,
      support,
      caller,
      instances.proxied
    );

    await helpers.setupFee(fee, owner, instances.proxied);
    await helpers.grantRole(
      helpers.MPC_ROLE,
      ovmAddress,
      owner,
      instances.proxied
    );
    await helpers.resolvePublicKey(
      supportedWalletTypeId,
      regularAddress,
      pki,
      fakeMPCAddress,
      ovmAddress,
      instances.proxied
    );
  });

  describe("positive tests", async () => {
    let positivePayloadHashTests = [
      {
        testName: "request signature for payload hash",
        walletTypeId: supportedWalletTypeId,
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

    for (let c of positivePayloadHashTests) {
      it(`shoud ${c.testName}`, async () => {
        //Given
          let tx;
        //When
          const nonce = await web3.eth.getTransactionCount(c.caller, "latest"); // nonce starts counting from 0

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

    let positivePayloadDataTests = [
      {
        testName: "request signature for payload without broadcast",
        walletTypeId: supportedWalletTypeId,
        publicKeyIndex: 0,
        fee: web3.utils.toWei("80", "gwei"),
        caller: regularAddress,
        isHash: false,
        isData: false,
        isTransaction: true,
        broadcast: true,
        dstChainId: helpers.GOERLI_CHAIN_ID,
      },
      {
        testName: "request signature for payload with broadcast",
        walletTypeId: supportedWalletTypeId,
        publicKeyIndex: 0,
        fee: web3.utils.toWei("80", "gwei"),
        caller: regularAddress,
        isHash: false,
        isData: false,
        isTransaction: true,
        broadcast: true,
        dstChainId: helpers.GOERLI_CHAIN_ID,
      },
    ];

    for (let c of positivePayloadDataTests) {
      it(`shoud ${c.testName}`, async () => {
        //Given
        let tx;
        //When
        const nonce = await web3.eth.getTransactionCount(c.caller, "latest"); // nonce starts counting from 0

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

        const payloadBytes = RLP.encode(transaction);
        const payload = `0x${RLP.utils.bytesToHex(payloadBytes)}`;

        tx = await helpers.requestSignatureForTransaction(
          c.walletTypeId,
          c.publicKeyIndex,
          c.dstChainId,
          payload,
          c.broadcast,
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
          payload,
          c.isHash,
          c.isData,
          c.isTransaction,
          c.broadcast
        );
      });
    }
  });

  describe("negative tests", async () => {
    let negativeTests = [
      {
        testName: "be able to request for unsupported wallet type",
        walletTypeId: unsupportedWalletTypeId,
        publicKeyIndex: 0,
        fee: web3.utils.toWei("80", "gwei"),
        caller: regularAddress,
        isHash: true,
        isData: true,
        isTransaction: true,
        dstChainId: helpers.GOERLI_CHAIN_ID,
        expectedError: "qs::walletTypeGuard:walletType not supported",
      },
      {
        testName: "be able to request for unsupported chain id",
        walletTypeId: supportedWalletTypeId,
        publicKeyIndex: 0,
        fee: web3.utils.toWei("80", "gwei"),
        caller: regularAddress,
        isHash: true,
        isData: true,
        isTransaction: true,
        dstChainId: helpers.UNSUPPORTED_CHAIN_ID,
        expectedError: "qs::chainIdGuard:chainId not supported",
      },
      {
        testName: "be able to request with incorrect key index",
        walletTypeId: supportedWalletTypeId,
        publicKeyIndex: 5,
        fee: web3.utils.toWei("80", "gwei"),
        caller: regularAddress,
        isHash: true,
        isData: true,
        isTransaction: true,
        dstChainId: helpers.GOERLI_CHAIN_ID,
        expectedError: "Index out of bounds",
      },
      {
        testName: "be able to request with less fee",
        walletTypeId: supportedWalletTypeId,
        publicKeyIndex: 0,
        fee: web3.utils.toWei("30", "gwei"),
        caller: regularAddress,
        isHash: true,
        isData: true,
        isTransaction: true,
        dstChainId: helpers.GOERLI_CHAIN_ID,
        expectedError: "qs::withFee:msg.value should be greater",
      }
    ];

    for (let c of negativeTests) {
      it(`shoud not ${c.testName}`, async () => {
        //Given
        let tx;
        let wallets;

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

        wallets = await helpers.getWallets(
          c.walletTypeId,
          c.caller,
          instances.proxied
        );

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
});
