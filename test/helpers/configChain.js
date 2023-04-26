const { assert } = require("chai");

async function assertWalletTypeSupport(
  walletTypeId,
  instance,
  supported = false
) {
  //Given
  let support;
  //When
  support = await isWalletTypeSupported(walletTypeId, instance);
  //Then
  assert.equal(support, supported);
}

async function isWalletTypeSupported(walletTypeId, instance) {
  //Given
  let support;
  //When
  support = await instance.isWalletTypeSupported.call(walletTypeId);
  //Then
  return support;
}

async function walletTypeIdConfig(
  purpose,
  coinType,
  support,
  caller,
  instance
) {
  //Given
  let tx;
  //When
  tx = instance.walletTypeIdConfig(purpose, coinType, support, {
    from: caller,
  });
  //Then
  return tx;
}

function checkWalletTypeConfigEvent(
  log,
  purpose,
  coinType,
  walletTypeId,
  support = false
) {
  assert.equal(
    log.event,
    "WalletTypeIdSupport",
    `Transaction: ${log.transactionHash} emitted wrong event`
  );
  assert.equal(
    log.args.purpose,
    purpose,
    `Wrong purpose event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.coinType.toString(),
    coinType.toString(),
    `Wrong coinType event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.walletTypeId.toString(),
    walletTypeId.toString(),
    `Wrong walletTypeId event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.support,
    support,
    `Wrong support event argument at transaction: ${log.transactionHash}`
  );
}

async function assertChainIdSupport(
  walletTypeId,
  chainId,
  instance,
  supported = false
) {
  //Given
  let support;
  //When
  support = await isChainIdSupported(walletTypeId, chainId, instance);
  //Then
  assert.equal(support, supported);
}

async function isChainIdSupported(walletTypeId, chainId, instance) {
  //Given
  let support;
  //When
  support = instance.isChainIdSupported.call(walletTypeId, chainId);
  //Then
  return support;
}

async function chainIdConfig(walletTypeId, caip, support, caller, instance) {
  //Given
  let tx;
  //When
  tx = instance.chainIdConfig(walletTypeId, caip, support, { from: caller });
  //Then
  return tx;
}

function checkChainIdConfigEvent(log, walletTypeId, chainId, caip, support = false) {
  assert.equal(
    log.event,
    "ChainIdSupport",
    `Transaction: ${log.transactionHash} emitted wrong event`
  );
  assert.equal(
    log.args.walletTypeId.toString(),
    walletTypeId.toString(),
    `Wrong walletTypeId event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.chainId.toString(),
    chainId.toString(),
    `Wrong chainId event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.caip,
    caip,
    `Wrong caip event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.support,
    support,
    `Wrong support event argument at transaction: ${log.transactionHash}`
  );
}

module.exports = {
  assertWalletTypeSupport,
  isWalletTypeSupported,
  walletTypeIdConfig,
  checkWalletTypeConfigEvent,
  assertChainIdSupport,
  isChainIdSupported,
  chainIdConfig,
  checkChainIdConfigEvent,
};
