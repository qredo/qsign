const { assert } = require("chai");
const helpers = require("./helpers");
const RLP = require("rlp");

contract("QSign resolve signature tests", (accounts) => {
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

    await helpers.setupFee(fee, caller, instances.proxied);
    await helpers.grantRole(
      helpers.MPC_ROLE,
      ovmAddress,
      caller,
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
        testName: "resolve signature for payload hash without broadcast",
        walletTypeId: supportedWalletTypeId,
        owner: regularAddress,
        publicKeyIndex: "0",
        dstChainId: helpers.GOERLI_CHAIN_ID,
        broadcast: false,
        caller: ovmAddress,
      },
    ];
    for (let c of positivePayloadHashTests) {
      it(`shoud ${c.testName}`, async () => {
        //Given
        let tx;

        //When
        const nonce = await web3.eth.getTransactionCount(c.owner, "latest"); // nonce starts counting from 0

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
        const signature = await web3.eth.sign(payloadHash, fakeMPCAddress);

        tx = await helpers.resolveSignature(
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
        await helpers.expectTXSuccess(tx);
        await helpers.checkResolveSignatureEvent(
          tx.receipt.logs[0],
          c.walletTypeId,
          c.owner,
          c.publicKeyIndex,
          c.dstChainId,
          payloadHash,
          signature
        );
      });
    }

    let positivePayloadTests = [
      {
        testName: "resolve signature for payload hash without broadcast",
        walletTypeId: supportedWalletTypeId,
        owner: regularAddress,
        publicKeyIndex: "0",
        dstChainId: helpers.GOERLI_CHAIN_ID,
        broadcast: false,
        caller: ovmAddress,
      },
      {
        testName: "resolve signature for payload hash and broadcast",
        walletTypeId: supportedWalletTypeId,
        owner: regularAddress,
        publicKeyIndex: "0",
        dstChainId: helpers.GOERLI_CHAIN_ID,
        broadcast: true,
        caller: ovmAddress,
      },
    ];

    for (let c of positivePayloadTests) {
      it(`shoud ${c.testName}`, async () => {
        //Given
        let tx;

        //When
        const nonce = await web3.eth.getTransactionCount(c.owner, "latest"); // nonce starts counting from 0

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
        const payloadHash = web3.utils.soliditySha3(payload);
        const signature = await web3.eth.sign(payloadHash, fakeMPCAddress);

        tx = await helpers.resolveSignature(
          c.walletTypeId,
          c.owner,
          c.publicKeyIndex,
          c.dstChainId,
          payload,
          signature,
          c.broadcast,
          c.caller,
          instances.proxied
        );

        //Then
        await helpers.expectTXSuccess(tx);
        await helpers.checkResolveSignatureEvent(
          tx.receipt.logs[0],
          c.walletTypeId,
          c.owner,
          c.publicKeyIndex,
          c.dstChainId,
          payload,
          signature
        );
      });
    }
  });

  describe("negative tests", async () => {
    let negativeTests = [
      {
        testName: "be able to resolve for unsupported wallet type id",
        walletTypeId: unsupportedWalletTypeId,
        owner: regularAddress,
        publicKeyIndex: 0,
        dstChainId: helpers.GOERLI_CHAIN_ID,
        broadcast: true,
        caller: ovmAddress,
        expectedError: "qs::walletTypeGuard:walletType not supported",
      },
      {
        testName: "be able to resolve for unsupported chain id",
        walletTypeId: supportedWalletTypeId,
        owner: regularAddress,
        publicKeyIndex: 0,
        dstChainId: helpers.UNSUPPORTED_CHAIN_ID,
        broadcast: true,
        caller: ovmAddress,
        expectedError: "qs::chainIdGuard:chainId not supported",
      },
      {
        testName: "be able to resolve with incorrect key index",
        walletTypeId: supportedWalletTypeId,
        owner: regularAddress,
        publicKeyIndex: 1,
        dstChainId: helpers.GOERLI_CHAIN_ID,
        broadcast: false,
        caller: ovmAddress,
        expectedError: "Index out of bounds",
      },
      {
        testName: "be able to resolve without ovm role",
        walletTypeId: supportedWalletTypeId,
        owner: regularAddress,
        publicKeyIndex: 0,
        dstChainId: helpers.GOERLI_CHAIN_ID,
        broadcast: true,
        caller: regularAddress,
        expectedError: "qs::onlyMPC:caller not authorized",
      },
    ];

    for (let c of negativeTests) {
      it(`shoud not ${c.testName}`, async () => {
        //Given
        let tx;
        //When
        const nonce = await web3.eth.getTransactionCount(c.owner, "latest"); // nonce starts counting from 0

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
        const signature = await web3.eth.sign(payloadHash, fakeMPCAddress);

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
      });
    }
  });
});
