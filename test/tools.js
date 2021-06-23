async function assertRevert(promise) {
  try {
    await promise;
    assert.fail("Expected revert not received");
  } catch (error) {
    const revertFound = error.message.search("revert") >= 0;
    assert(revertFound, `Expected "revert", got ${error} instead`);
  }
}

async function getAdmin(proxy) {
  const adminSlot = "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b";
  let adm = await web3.eth.getStorageAt(proxy.address, adminSlot);
  adm = web3.eth.abi.decodeParameter("address", adm);
  return adm;
}

async function getImplementation(proxy) {
  const implSlot = "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3";
  let impl = await web3.eth.getStorageAt(proxy.address, implSlot);
  impl = web3.eth.abi.decodeParameter("address", impl);
  return impl;
}

module.exports = {
  assertRevert,
  getAdmin,
  getImplementation,
};
