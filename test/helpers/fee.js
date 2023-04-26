async function getFee(instance) {
  //Given
  let fee;
  //When
  fee = instance.getFee.call();
  //Then
  return fee;
}

async function setupFee(newFee, caller, instance) {
  //Given
  let tx;
  //When
  tx = instance.setupFee(newFee, { from: caller });
  //Then
  return tx;
}

function checkFeeEvent(log, oldFee, newFee) {
  assert.equal(
    log.event,
    "FeeUpdate",
    `Transaction: ${log.transactionHash} emitted wrong event`
  );
  assert.equal(
    log.args.newFee,
    newFee,
    `Wrong new fee update event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.oldFee.toString(),
    oldFee.toString(),
    `Wrong old fee update event argument at transaction: ${log.transactionHash}`
  );
}

async function withdrawFees(caller, instance) {
  //Given
  let tx;
  //When
  tx = instance.withdrawFees(newFee, { from: caller });
  //Then
  return tx;
}

function checkFeeWithdrawEvent(log, to, amount) {
  assert.equal(
    log.event,
    "Withdraw",
    `Transaction: ${log.transactionHash} emitted wrong event`
  );
  assert.equal(
    log.args.to,
    to,
    `Wrong withdraw fee to event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.amount.toString(),
    amount.toString(),
    `Wrong withdraw fee amount event argument at transaction: ${log.transactionHash}`
  );
}

module.exports = {
  getFee,
  setupFee,
  checkFeeEvent,
  withdrawFees,
  checkFeeWithdrawEvent,
};
