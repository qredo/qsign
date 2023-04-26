const deployer = require("./deployer.js");
const fee = require("./fee.js");
const configChain = require("./configChain.js");
const publicKey = require("./publicKey.js");
const signature = require("./signature.js");
const accessControl = require("./accessControl.js");
const misc = require("./misc.js");
const chainTypes = require("./chainTypes.js");
const chainIds = require("./chainIds.js");

module.exports = {
  ...deployer,
  ...misc,
  ...fee,
  ...configChain,
  ...publicKey,
  ...accessControl,
  ...signature,
  ...chainTypes,
  ...chainIds,
};
