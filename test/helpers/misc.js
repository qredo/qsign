const { assert } = require("chai");

async function expectRevert(promise, reason, print = false) {
  let tx;
  try {
    tx = await promise;
    assert.fail(`expected transaction ${tx.tx} to revert, but did not`);
  } catch (error) {
    if (print == true) {
      console.log("error ", error);
      console.log("reason ", reason);
    }
    if (reason) {
      if (
        error.message.includes("Reason given: Custom error (could not decode)")
      ) {
        assert.equal(
          error.data.result,
          reason,
          `unrecognized custom error: ${reason}`
        );
      } else {
        assert.include(
          error.reason.toLowerCase(),
          reason.toLowerCase(),
          `unrecognized revert error: ${error.message}`
        );
      }
    }
  }
}

function expectTXSuccess(tx) {
  assert.isTrue(tx.receipt.status, `Transaction: ${tx.tx} failed`);
}

function checkLog(log, expectedLog, expectedArgs) {
  assert.equal(
    log.event,
    expectedLog,
    `Transaction: ${tx.receipt.logs[0].transactionHash} emitted wrong event`
  );
  for (let i = 0; i < log.args.__length__; i++) {
    assert.equal(
      log.args[i].toString(),
      expectedArgs[i].toString(),
      `Wrong old fee update at transaction: ${tx.receipt.logs[0].transactionHash}`
    );
  }
}

function verifyUpgradeEvent(e, implAddress) {
  assert.equal(e.event, "Upgraded", "wrong Upgrade event");
  assert.equal(
    e.args.implementation,
    implAddress,
    "wrong implementation address"
  );
}

module.exports = {
  expectRevert,
  verifyUpgradeEvent,
  expectTXSuccess,
  checkLog,
};
