const { assert } = require("chai");
const QProxy = artifacts.require("QProxy");
const QSign = artifacts.require("QSign");

async function initQSignWithProxy(proxyAdmin, owner) {
  let implInstance = await QSign.new();
  const implContract = new web3.eth.Contract(implInstance.abi);
  const data = implContract.methods.initializeV1().encodeABI();

  let QProxyInstance = await QProxy.new(
    implInstance.address,
    proxyAdmin,
    data,
    { from: owner }
  );
  let Proxied = await QSign.at(QProxyInstance.address);
  return {
    implementation: implInstance,
    proxy: QProxyInstance,
    proxied: Proxied,
  };
}

module.exports = {
  initQSignWithProxy,
};
