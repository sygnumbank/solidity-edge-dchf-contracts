async function assertRevert(promise){
  try {
    await promise;
    assert.fail('Expected revert not received');
  } catch (error) {
    const revertFound = error.message.search('revert') >= 0;
    assert(revertFound, `Expected "revert", got ${error} instead`);
  }
}

async function getAdmin(proxy) {
    let adminSlot = "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b";
    let adm = web3.eth.getStorageAt(proxy.address, adminSlot);
    return adm;
}

async function getImplementation(proxy) {
    let implSlot = "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3";
    let impl = web3.eth.getStorageAt(proxy.address, implSlot);
    return impl;
}

module.exports = {
    assertRevert: assertRevert,
    getAdmin: getAdmin,
    getImplementation: getImplementation
};
