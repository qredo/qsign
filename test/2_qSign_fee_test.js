const { assert } = require("chai");
const helpers = require("./helpers");

contract("QSign fee tests", (accounts) => {
  const owner = accounts[0];
  const proxyAdmin = accounts[9];
  const regularAddress = accounts[1];

  let instances;

  beforeEach(async () => {
    instances = await helpers.initQSignWithProxy(proxyAdmin, owner);
  });

  describe("positive tests", async () => {
    it("shoud setup fee", async () => {
      //Given
      let oldFee;
      let updatedFee;
      let expectedFee = web3.utils.toWei("80", "gwei");
      let tx;

      //When
      oldFee = await helpers.getFee(instances.proxied);
      tx = await helpers.setupFee(expectedFee, owner, instances.proxied);
      updatedFee = await helpers.getFee(instances.proxied);

      //Then
      await helpers.expectTXSuccess(tx);
      await helpers.checkFeeEvent(tx.receipt.logs[0], oldFee, expectedFee);
      assert.equal(
        updatedFee,
        expectedFee,
        `Contract state not updated correctly. Transaction: ${tx.tx}`
      );
    });
  });

  describe("negative tests", async () => {
    it("shoud not setup fee without role", async () => {
      //Given
      let tx;
      let expectedFee = web3.utils.toWei("80", "gwei");
      let defaultAdminRole;
      let expectedError;

      //When
      defaultAdminRole = await instances.proxied.DEFAULT_ADMIN_ROLE.call();
      expectedError = `AccessControl: account ${regularAddress} is missing role ${defaultAdminRole}`;

      tx = helpers.setupFee(expectedFee, regularAddress, instances.proxied);

      //Then
      await helpers.expectRevert(tx, expectedError);
    });
  });
});
