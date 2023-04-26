const QSignTypes = artifacts.require("QSignTypes");
const QSign = artifacts.require("QSign");
const QProxy = artifacts.require("QProxy");
const fs = require("fs");
const path = require("path");

if (fs.existsSync(path.join(__dirname, "..", "config.js"))) {
  ({
    PROXY_ADMIN_ADDRESS: proxyAdminAddress,
    Q_SIGN_TYPES: qSignTypesLibAddress,
  } = require("../config.js"));
}

module.exports = function (deployer, network, accounts) {
  deployer.then(async () => {
    console.log();

    console.log(`starting migration for ${network} network`);

    console.log();

    if (deployer.network === "development") {
      proxyAdminAddress = accounts[1];
    }
    qSignTypesLibAddress = undefined;

    console.log(`Proxy Admin:     ${proxyAdminAddress}`);

    if (!proxyAdminAddress) {
      throw new Error("PROXY_ADMIN_ADDRESS  must be provided in config.js");
    }

    if (
      proxyAdminAddress.toString().toLowerCase() ===
      accounts[0].toString().toLowerCase()
    ) {
      throw new Error(
        "PROXY_ADMIN_ADDRESS  must be different than deployer address please change PROXY_ADMIN_ADDRESS in config.js"
      );
    }

    console.log();
    let QSignTypesInstance;
    if (!qSignTypesLibAddress) {
      console.log("Deploying QSignTypes library contract...");
      QSignTypesInstance = await deployer.deploy(QSignTypes);
      console.log(
        "Deployed QSignTypes library contract at",
        QSignTypesInstance.address
      );
    } else {
      console.log(
        "QSignTypes library contract found at address: ",
        qSignTypesLibAddress
      );
      QSignTypesInstance = await QSignTypes.at(qSignTypesLibAddress);
    }
    console.log("link q-sign-types library contract...");
    deployer.link(QSignTypes, [QSign]);

    console.log("Deploying q-sign implementation contract...");
    let QSignInstance = await deployer.deploy(QSign);
    console.log(
      "Deployed q-sign implementation contract at",
      QSignInstance.address
    );

    console.log();

    console.log("Preparing proxy initialization data... ");
    const QSignContract = new web3.eth.Contract(QSignInstance.abi);
    const data = QSignContract.methods.initializeV1().encodeABI();
    console.log("Prepared initialization data: ", data);

    console.log();

    console.log("Deploying  q-sign proxy contract...");
    let QSignFactoryProxyInstance = await deployer.deploy(
      QProxy,
      QSignInstance.address,
      proxyAdminAddress,
      data
    );
    console.log(
      "Deployed q-sign proxy contract at",
      QSignFactoryProxyInstance.address
    );

    console.log();
  });
};
