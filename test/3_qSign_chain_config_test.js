const { assert } = require("chai");
const { default: Web3 } = require("web3");
const helpers = require("./helpers");

contract("QSign chain config tests", (accounts) => {
  const owner = accounts[0];
  const proxyAdmin = accounts[9];
  const regularAddress = accounts[1];

  let instances;

  beforeEach(async () => {
    instances = await helpers.initQSignWithProxy(proxyAdmin, owner);
  });

  describe("wallet type config positive tests", async () => {
    let positiveTestCases = [
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
    for (let c of positiveTestCases) {
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

    it("should remove wallet type for BTC", async () => {
      //Given
      const wt = helpers.BTC_CHAIN_TYPE;
      const walletTypeIdPayload = web3.eth.abi.encodeParameters(
        ["uint256", "uint256"],
        [wt.purpose, wt.coinType]
      );
      const walletTypeId = web3.utils.keccak256(walletTypeIdPayload);
      const support = true;
      const caller = owner;
      let tx;
      let supportedBefore;
      let supportedAfter;
      //When
      await helpers.walletTypeIdConfig(
        wt.purpose,
        wt.coinType,
        support,
        caller,
        instances.proxied
      );
      supportedBefore = await helpers.isWalletTypeSupported(
        walletTypeId,
        instances.proxied
      );
      tx = await helpers.walletTypeIdConfig(
        wt.purpose,
        wt.coinType,
        !support,
        caller,
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
        wt.purpose,
        wt.coinType,
        walletTypeId
      );
      assert.notEqual(supportedBefore, supportedAfter);
    });
  });

  describe("wallet type config negative tests", async () => {
    it("should not config wallet type from account without role", async () => {
      //Given
      const wt = helpers.BTC_CHAIN_TYPE;
      const walletTypeIdPayload = web3.eth.abi.encodeParameters(
        ["uint256", "uint256"],
        [wt.purpose, wt.coinType]
      );
      const walletTypeId = web3.utils.keccak256(walletTypeIdPayload);
      const support = true;
      const caller = regularAddress;
      let defaultAdminRole;
      let tx;
      let supportedBefore;
      let supportedAfter;
      let expectedError;
      //When
      defaultAdminRole = await instances.proxied.DEFAULT_ADMIN_ROLE.call();
      expectedError = `AccessControl: account ${caller} is missing role ${defaultAdminRole}`;
      supportedBefore = await helpers.isWalletTypeSupported(
        walletTypeId,
        instances.proxied
      );
      tx = helpers.walletTypeIdConfig(
        wt.purpose,
        wt.coinType,
        support,
        caller,
        instances.proxied
      );
      supportedAfter = await helpers.isWalletTypeSupported(
        walletTypeId,
        instances.proxied
      );
      //Then
      await helpers.expectRevert(tx, expectedError);
      assert.equal(supportedBefore, supportedAfter);
    });

    it("should not allow support for already supported wallet type", async () => {
      //Given
      const wt = helpers.BTC_CHAIN_TYPE;
      const support = true;
      const caller = owner;
      let tx;
      const expectedError = `qs::supportWalletTypeId:walletTypeId is already supported`;
      //When
      await helpers.walletTypeIdConfig(
        wt.purpose,
        wt.coinType,
        support,
        caller,
        instances.proxied
      );
      tx = helpers.walletTypeIdConfig(
        wt.purpose,
        wt.coinType,
        support,
        caller,
        instances.proxied
      );
      //Then
      await helpers.expectRevert(tx, expectedError);
    });

    it("should not allow remove support for non supported wallet type", async () => {
      //Given
      const wt = helpers.BTC_CHAIN_TYPE;
      const support = false;
      const caller = owner;
      let tx;
      const expectedError = `qs::supportWalletTypeId:walletTypeId is not supported`;
      //When
      tx = helpers.walletTypeIdConfig(
        wt.purpose,
        wt.coinType,
        support,
        caller,
        instances.proxied
      );
      //Then
      await helpers.expectRevert(tx, expectedError);
    });
  });

  describe("chain id config positive tests", async () => {
    let positiveTestCases = [
      {
        testName: "support BTC chain id",
        walletType: helpers.BTC_CHAIN_TYPE,
        caip: helpers.BTC_TESTNET_CAIP,
        chainId: helpers.BTC_TESTNET_CHAIN_ID,
        support: true,
        caller: owner,
      },
      {
        testName: "support GOERLI chain id",
        walletType: helpers.EVM_CHAIN_TYPE,
        caip: helpers.GOERLI_CAIP,
        chainId: helpers.GOERLI_CHAIN_ID,
        support: true,
        caller: owner,
      },
      {
        testName: "support ETH chain id",
        walletType: helpers.EVM_CHAIN_TYPE,
        caip: helpers.ETH_CAIP,
        chainId: helpers.ETH_CHAIN_ID,
        support: true,
        caller: owner,
      },
      {
        testName: "support MUMBAI chain id",
        walletType: helpers.EVM_CHAIN_TYPE,
        caip: helpers.MUMBAI_CAIP,
        chainId: helpers.MUMBAI_CHAIN_ID,
        support: true,
        caller: owner,
      },
    ];

    for (let c of positiveTestCases) {
      it(`shoud ${c.testName}`, async () => {
        //Given
        const walletTypeIdPayload = web3.eth.abi.encodeParameters(
          ["uint256", "uint256"],
          [c.walletType.purpose, c.walletType.coinType]
        );
        const walletTypeId = web3.utils.keccak256(walletTypeIdPayload);
        let tx;
        //When
        await helpers.walletTypeIdConfig(
          c.walletType.purpose,
          c.walletType.coinType,
          c.support,
          c.caller,
          instances.proxied
        );
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

    it("should remove chain id for ETH", async () => {
      //Given
      const wt = helpers.EVM_CHAIN_TYPE;
      const caip = helpers.ETH_CAIP;
      const chainId = helpers.ETH_CHAIN_ID;
      const walletTypeIdPayload = web3.eth.abi.encodeParameters(
        ["uint256", "uint256"],
        [wt.purpose, wt.coinType]
      );
      const walletTypeId = web3.utils.keccak256(walletTypeIdPayload);
      const support = true;
      const caller = owner;
      let tx;
      let supportedBefore;
      let supportedAfter;
      //When
      await helpers.walletTypeIdConfig(
        wt.purpose,
        wt.coinType,
        support,
        caller,
        instances.proxied
      );
      await helpers.chainIdConfig(
        walletTypeId,
        caip,
        support,
        caller,
        instances.proxied
      );
      supportedBefore = await helpers.isChainIdSupported(
        walletTypeId,
        chainId,
        instances.proxied
      );
      tx = await helpers.chainIdConfig(
        walletTypeId,
        caip,
        !support,
        caller,
        instances.proxied
      );
      supportedAfter = await helpers.isChainIdSupported(
        walletTypeId,
        chainId,
        instances.proxied
      );
      //Then
      await helpers.expectTXSuccess(tx);
      await helpers.assertChainIdSupport(
        walletTypeId,
        chainId,
        instances.proxied
      );
      await helpers.checkChainIdConfigEvent(
        tx.receipt.logs[0],
        walletTypeId,
        chainId,
        caip
      );
      assert.notEqual(supportedBefore, supportedAfter);
    });
  });

  describe("chain id config negative tests", async () => {
    it("should not config chain id from account without role", async () => {
      //Given
      const wt = helpers.EVM_CHAIN_TYPE;
      const chainId = helpers.ETH_CHAIN_ID;

      const walletTypeIdPayload = web3.eth.abi.encodeParameters(
        ["uint256", "uint256"],
        [wt.purpose, wt.coinType]
      );
      const walletTypeId = web3.utils.keccak256(walletTypeIdPayload);
      const support = true;
      const caller = regularAddress;
      let defaultAdminRole;
      let tx;
      let supportedBefore;
      let supportedAfter;
      let expectedError;
      //When
      defaultAdminRole = await instances.proxied.DEFAULT_ADMIN_ROLE.call();
      expectedError = `AccessControl: account ${caller} is missing role ${defaultAdminRole}`;
      await helpers.walletTypeIdConfig(
        wt.purpose,
        wt.coinType,
        support,
        owner,
        instances.proxied
      );

      supportedBefore = await helpers.isChainIdSupported(
        walletTypeId,
        chainId,
        instances.proxied
      );
      tx = helpers.chainIdConfig(
        walletTypeId,
        chainId,
        support,
        caller,
        instances.proxied
      );
      supportedAfter = await helpers.isChainIdSupported(
        walletTypeId,
        chainId,
        instances.proxied
      );
      //Then
      await helpers.expectRevert(tx, expectedError);
      assert.equal(supportedBefore, supportedAfter);
    });

    it("should not allow support for already supported chain id", async () => {
      //Given
      const wt = helpers.EVM_CHAIN_TYPE;
      const chainId = helpers.ETH_CHAIN_ID;

      const walletTypeIdPayload = web3.eth.abi.encodeParameters(
        ["uint256", "uint256"],
        [wt.purpose, wt.coinType]
      );
      const walletTypeId = web3.utils.keccak256(walletTypeIdPayload);
      const support = true;
      const caller = owner;
      let tx;
      const expectedError = `qs::chainIdConfig:chainId is already supported`;
      //When
      await helpers.walletTypeIdConfig(
        wt.purpose,
        wt.coinType,
        support,
        owner,
        instances.proxied
      );

      await helpers.chainIdConfig(
        walletTypeId,
        chainId,
        support,
        caller,
        instances.proxied
      );
      tx = helpers.chainIdConfig(
        walletTypeId,
        chainId,
        support,
        caller,
        instances.proxied
      );
      //Then
      await helpers.expectRevert(tx, expectedError);
    });

    it("should not allow remove support for non supported chain id", async () => {
      //Given
      const wt = helpers.EVM_CHAIN_TYPE;
      const chainId = helpers.ETH_CHAIN_ID;

      const walletTypeIdPayload = web3.eth.abi.encodeParameters(
        ["uint256", "uint256"],
        [wt.purpose, wt.coinType]
      );
      const walletTypeId = web3.utils.keccak256(walletTypeIdPayload);
      const support = true;
      const caller = owner;
      let tx;
      const expectedError = `qs::chainIdConfig:chainId is not supported`;
      //When
      await helpers.walletTypeIdConfig(
        wt.purpose,
        wt.coinType,
        support,
        owner,
        instances.proxied
      );
      tx = helpers.chainIdConfig(
        walletTypeId,
        chainId,
        !support,
        caller,
        instances.proxied
      );
      //Then
      await helpers.expectRevert(tx, expectedError);
    });

    it("should not allow support for chain id for non supported wallet type", async () => {
      //Given
      const wtId = helpers.EVM_CHAIN_TYPE_HASH;
      const chainId = helpers.ETH_CHAIN_ID;
      const support = true;
      const caller = owner;
      let tx;
      const expectedError = `qs::walletTypeGuard:walletType not supported`;
      //When
      tx = helpers.chainIdConfig(
        wtId,
        chainId,
        support,
        caller,
        instances.proxied
      );
      //Then
      await helpers.expectRevert(tx, expectedError);
    });
  });
});
