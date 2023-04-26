async function requestSignatureForHash(
  walletTypeId,
  publicKeyIndex,
  dstChainId,
  payload,
  msgValue,
  caller,
  instance
) {
  //Given
    let tx;
  //When
    tx = instance.requestSignatureForHash(
      walletTypeId,
      publicKeyIndex,
      dstChainId,
      payload,
      { from: caller, value: msgValue }
    );
  //Then
    return tx;
}

async function requestSignatureForData(
  walletTypeId,
  publicKeyIndex,
  dstChainId,
  payload,
  msgValue,
  caller,
  instance
) {
  //Given
    let tx;
  //When
    tx = instance.requestSignatureForData(
      walletTypeId,
      publicKeyIndex,
      dstChainId,
      payload,
      { from: caller, value: msgValue }
    );
  //Then
    return tx;
}

async function requestSignatureForTransaction(
  walletTypeId,
  publicKeyIndex,
  dstChainId,
  payload,
  broadcast,
  msgValue,
  caller,
  instance
) {
  //Given
    let tx;
  //When
    tx = instance.requestSignatureForTransaction(
      walletTypeId,
      publicKeyIndex,
      dstChainId,
      payload,
      broadcast,
      { from: caller, value: msgValue }
    );
  //Then
    return tx;
}

async function resolveSignature(
  walletTypeId,
  owner,
  publicKeyIndex,
  dstChainId,
  payload,
  signature,
  broadcast,
  caller,
  instance
) {
  //Given
    let tx;
  //When
    tx = instance.resolveSignature(
      walletTypeId,
      owner,
      publicKeyIndex,
      dstChainId,
      payload,
      signature,
      broadcast,
      { from: caller }
    );
  //Then
    return tx;
}

function checkRequestSignatureEvent(
  log,
  walletTypeId,
  caller,
  publicKeyIndex,
  dstChainId,
  payload,
  isHash = false,
  isData = false,
  isTransaction = false,
  broadcast = false
) {
  assert.equal(
    log.event,
    "RequestSignature",
    `Transaction: ${log.transactionHash} emitted wrong event`
  );
  assert.equal(
    log.args.walletTypeId,
    walletTypeId,
    `Wrong walletTypeId event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.owner,
    caller,
    `Wrong caller event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.publicKeyIndex.toString(),
    publicKeyIndex.toString(),
    `Wrong public key index event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    web3.utils.sha3(log.args.dstChainId),
    web3.utils.sha3(dstChainId),
    `Wrong destination chain id event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.payload,
    payload,
    `Wrong payload event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.isHash,
    isHash,
    `Wrong is hash event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.isData,
    isData,
    `Wrong is data event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.isTransaction,
    isTransaction,
    `Wrong is transaction event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.broadcast,
    broadcast,
    `Wrong broadcast event argument at transaction: ${log.transactionHash}`
  );
}

function checkResolveSignatureEvent(
  log,
  walletTypeId,
  owner,
  publicKeyIndex,
  dstChainId,
  payload,
  signature
) {
  assert.equal(
    log.event,
    "ResolveSignature",
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
    `Wrong caller event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.publicKeyIndex.toString(),
    publicKeyIndex.toString(),
    `Wrong public key index event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.dstChainId.toString(),
    dstChainId.toString(),
    `Wrong destination chain id event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.payload,
    payload,
    `Wrong payload event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.signature,
    signature,
    `Wrong signature event argument at transaction: ${log.transactionHash}`
  );
}

module.exports = {
  requestSignatureForHash,
  requestSignatureForData,
  requestSignatureForTransaction,
  resolveSignature,
  checkRequestSignatureEvent,
  checkResolveSignatureEvent,
};
