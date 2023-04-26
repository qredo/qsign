const { assert } = require("chai");
const helpers = require("./helpers");

contract("QSign resolve public key tests", (accounts) => {
  const owner = accounts[0];
  const proxyAdmin = accounts[9];
  const regularAddress = accounts[1];
  const ovmAddress = accounts[2];
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const fakeMPCAddress = accounts[8];
  const supportedWalletTypeId = helpers.EVM_CHAIN_TYPE_HASH;
  const unsupportedWalletTypeId = helpers.UNSUPPORTED_CHAIN_TYPE_HASH;
  const fee = web3.utils.toWei("80", "gwei");

  let instances;

  beforeEach(async () => {
    instances = await helpers.initQSignWithProxy(proxyAdmin, owner);
    await helpers.setupFee(fee, owner, instances.proxied);
    await helpers.grantRole(
      helpers.MPC_ROLE,
      ovmAddress,
      owner,
      instances.proxied
    );

    const wt = helpers.EVM_CHAIN_TYPE;
    const support = true;
    const caller = owner;
    await helpers.walletTypeIdConfig(
      wt.purpose,
      wt.coinType,
      support,
      caller,
      instances.proxied
    );
  });

  describe("positive tests", async () => {
    it("shoud resolve public key for chain type", async () => {
      //Given
      let tx;
      let walletsBefore;
      let walletsAfter;

      //When
      walletsBefore = await helpers.getWallets(
        supportedWalletTypeId,
        regularAddress,
        instances.proxied
      );

      tx = await helpers.resolvePublicKey(
        supportedWalletTypeId,
        regularAddress,
        walletsBefore.length,
        fakeMPCAddress,
        ovmAddress,
        instances.proxied
      );

      walletsAfter = await helpers.getWallets(
        supportedWalletTypeId,
        regularAddress,
        instances.proxied
      );

      //Then
      await helpers.expectTXSuccess(tx);
      await helpers.checkResolvePublicKeyEvent(
        tx.receipt.logs[0],
        supportedWalletTypeId,
        walletsBefore.length,
        regularAddress,
        fakeMPCAddress,
        ovmAddress
      );
      assert.equal(walletsAfter.length, walletsBefore.length + 1);
    });
  });

  describe("negative tests", async () => {
    let negativeTests = [
      {
        testName: "be able to resolve for unsupported for wallet type",
        walletTypeId: unsupportedWalletTypeId,
        owner: regularAddress,
        mpcAddress: fakeMPCAddress,
        caller: ovmAddress,
        expectedError: "qs::walletTypeGuard:walletType not supported",
      },
      {
        testName: "be able to resolve zero address",
        walletTypeId: supportedWalletTypeId,
        owner: zeroAddress,
        mpcAddress: fakeMPCAddress,
        caller: ovmAddress,
        expectedError: "qs::ownerGuard:invalid owner address",
      },
      {
        testName: "be able to resolve with incorrect public key",
        walletTypeId: supportedWalletTypeId,
        owner: regularAddress,
        mpcAddress: "",
        caller: ovmAddress,
        expectedError: "qs::validatePublicKey:incorrect public key",
      },
      {
        testName: "be able to resolve without ovm role",
        walletTypeId: supportedWalletTypeId,
        owner: regularAddress,
        mpcAddress: fakeMPCAddress,
        caller: owner,
        expectedError: "qs::onlyMPC:caller not authorized",
      },
    ];

    for (let c of negativeTests) {
      it(`shoud not ${c.testName}`, async () => {
        //Given
        let tx;
        let walletsBefore;
        let walletsAfter;
        //When
        walletsBefore = await helpers.getWallets(
          supportedWalletTypeId,
          regularAddress,
          instances.proxied
        );

        tx = helpers.resolvePublicKey(
          c.walletTypeId,
          c.owner,
          walletsBefore.length,
          c.mpcAddress,
          c.caller,
          instances.proxied
        );

        walletsAfter = await helpers.getWallets(
          supportedWalletTypeId,
          regularAddress,
          instances.proxied
        );

        //Then
        await helpers.expectRevert(tx, c.expectedError);
        assert.equal(walletsBefore.length, walletsAfter.length);
      });
    }

    it("shoud not resolve public key for chain type with wrong public key index", async () => {
      //Given
        let tx;
        let walletsBefore;
        let walletsAfter;
        const expectedError = "qs::resolvePublicKey:incorrect publicKeyIndex"
      //When
        walletsBefore = await helpers.getWallets(
          supportedWalletTypeId,
          regularAddress,
          instances.proxied
        );

        tx = helpers.resolvePublicKey(
          supportedWalletTypeId,
          regularAddress,
          walletsBefore.length+1,
          fakeMPCAddress,
          ovmAddress,
          instances.proxied
        );

        walletsAfter = await helpers.getWallets(
          supportedWalletTypeId,
          regularAddress,
          instances.proxied
        );

      //Then
        await helpers.expectRevert(tx, expectedError);
        assert.equal(walletsBefore.length, walletsAfter.length);
    });
    it("shoud not resolve public key for chain type twice", async () => {
      //Given
        let tx;
        let walletsBefore;
        let walletsAfter;
        const pki = 0;
        const expectedError = "qs::resolvePublicKey:incorrect publicKeyIndex"
      //When
        walletsBefore = await helpers.getWallets(
          supportedWalletTypeId,
          regularAddress,
          instances.proxied
        );

        tx = await helpers.resolvePublicKey(
          supportedWalletTypeId,
          regularAddress,
          pki,
          fakeMPCAddress,
          ovmAddress,
          instances.proxied
        );

        await helpers.expectTXSuccess(tx);
        await helpers.checkResolvePublicKeyEvent(
          tx.receipt.logs[0],
          supportedWalletTypeId,
          walletsBefore.length,
          regularAddress,
          fakeMPCAddress,
          ovmAddress
        );

        walletsAfter = await helpers.getWallets(
          supportedWalletTypeId,
          regularAddress,
          instances.proxied
        );

        assert.equal(walletsAfter.length, walletsBefore.length + 1);

        walletsBefore = await helpers.getWallets(
          supportedWalletTypeId,
          regularAddress,
          instances.proxied
        );

        tx = helpers.resolvePublicKey(
          supportedWalletTypeId,
          regularAddress,
          pki,
          fakeMPCAddress,
          ovmAddress,
          instances.proxied
        );

        walletsAfter = await helpers.getWallets(
          supportedWalletTypeId,
          regularAddress,
          instances.proxied
        );

      //Then
        await helpers.expectRevert(tx, expectedError);
        assert.equal(walletsBefore.length, walletsAfter.length);
    });
  });
});
