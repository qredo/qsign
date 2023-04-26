const DEFAULT_ADMIN_ROLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const MPC_ROLE =
  "0xe10371affd65e24cab392f019bf45e5e4f84b16aafda5a4c67d3489692543958"; // web3.utils.keccak256("qredo.role.mpc");

async function grantRole(role, account, caller, instance) {
  //Given
  let tx;
  //When
  tx = instance.grantRole(role, account, { from: caller });
  //Then
  return tx;
}

async function revokeRole(role, account, caller, instance) {
  //Given
  let tx;
  //When
  tx = instance.revokeRole(role, account, { from: caller });
  //Then
  return tx;
}

async function renounceRole(role, account, caller, instance) {
  //Given
  let tx;
  //When
  tx = instance.renounceRole(role, account, { from: caller });
  //Then
  return tx;
}

async function hasRole(role, address, instance) {
  //Given
  let res;
  //When
  res = instance.hasRole.call(role, address);
  //Then
  return res;
}

function checkGrandRoleEvent(log, role, account, caller) {
  assert.equal(
    log.event,
    "RoleGranted",
    `Transaction: ${log.transactionHash} emitted wrong event`
  );
  assert.equal(
    log.args.role,
    role,
    `Wrong role event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.account,
    account,
    `Wrong account event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.sender,
    caller,
    `Wrong caller event argument at transaction: ${log.transactionHash}`
  );
}

function checkRevokeRoleEvent(log, role, account, caller) {
  assert.equal(
    log.event,
    "RoleRevoked",
    `Transaction: ${log.transactionHash} emitted wrong event`
  );
  assert.equal(
    log.args.role,
    role,
    `Wrong role event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.account,
    account,
    `Wrong account event argument at transaction: ${log.transactionHash}`
  );
  assert.equal(
    log.args.sender,
    caller,
    `Wrong caller event argument at transaction: ${log.transactionHash}`
  );
}

module.exports = {
  grantRole,
  revokeRole,
  renounceRole,
  hasRole,
  checkGrandRoleEvent,
  checkRevokeRoleEvent,
  DEFAULT_ADMIN_ROLE,
  MPC_ROLE,
};
