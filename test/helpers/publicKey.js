const { assert } = require("chai");

async function getWallets(walletTypeId, owner, instance) {
  return await instance.getWallets.call(walletTypeId, owner);
}

async function requestPublicKey(walletTypeId, msgValue, caller, instance) {
  //Given
  let tx;
  //When
  tx = instance.requestPublicKey(walletTypeId, {
    from: caller,
    value: msgValue,
  });
  //Then
  return tx;
}

function checkRequestPublicKeyEvent(log, walletTypeId, owner, walletIndex) {
  assert.equal(
    log.event,
    "RequestPublicKey",
    `Transaction: ${log.transactionHash} emitted wrong event`
  );
  assert.equal(
    log.args.walletTypeId,
    walletTypeId,
    `Wrong walletTypeId event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.owner,
    owner,
    `Wrong owner event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.walletIndex.toString(),
    walletIndex.toString(),
    `Wrong wallet index event argument at transaction: ${log.transactionHash}`
  );
}

async function resolvePublicKey(
  walletTypeId,
  owner,
  publicKeyIndex,
  publicKey,
  caller,
  instance
) {
  //Given
  let tx;
  //When
  tx = instance.resolvePublicKey(walletTypeId, owner, publicKeyIndex, publicKey, {
    from: caller,
  });
  //Then
  return tx;
}

function checkResolvePublicKeyEvent(
  log,
  walletTypeId,
  publicKeyIndex,
  owner,
  publicKey,
  ovm
) {
  assert.equal(
    log.event,
    "ResolvePublicKey",
    `Transaction: ${log.transactionHash} emitted wrong event`
  );
  assert.equal(
    log.args.walletTypeId,
    walletTypeId,
    `Wrong walletTypeId event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.publicKeyIndex.toString(),
    publicKeyIndex.toString(),
    `Wrong public key index event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.owner,
    owner,
    `Wrong owner address event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.publicKey,
    publicKey,
    `Wrong public key event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.ovm,
    ovm,
    `Wrong ovm address event argument at transaction: ${log.transactionHash}`
  );
}

module.exports = {
  getWallets,
  requestPublicKey,
  checkRequestPublicKeyEvent,
  resolvePublicKey,
  checkResolvePublicKeyEvent,
};
