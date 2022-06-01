const { BN, constants, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");
const { encodeCall } = require("zos-lib"); /* TODO update library to openzeppelin/upgrades */
const { ethers } = require("ethers");

const { assertRevert, getAdmin, getImplementation } = require("./tools");

const { ZERO_ADDRESS } = constants;

const BigNumber = ethers.utils.bigNumberify;

/* edge */
const EdgeToken = artifacts.require("EdgeToken");
const EdgeTokenProxy = artifacts.require("EdgeTokenProxy");
const EdgeTokenV1 = artifacts.require("EdgeTokenV1");
const EdgeTokenConstructorUpgrade = artifacts.require("EdgeTokenConstructorUpgrade");
const EdgeTokenWhitelistableUpgrade = artifacts.require("EdgeTokenWhitelistableUpgrade");
const EdgeTokenBlockUnblockTraderUpgrade = artifacts.require("EdgeTokenBlockUnblockTraderUpgrade");
const EdgeTokenDecimalUpgrade = artifacts.require("EdgeTokenDecimalUpgrade");
const EdgeTokenSystemConfiscateUpgrade = artifacts.require("EdgeTokenSystemConfiscateUpgrade");

const newBool = true;
const newUint = 5;

const TWO_ADDRESSES = ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb49", "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb42"];

module.exports = {
  BN,
  BigNumber,
  constants,
  expectEvent,
  expectRevert,
  ZERO_ADDRESS,
  assertRevert,
  getAdmin,
  getImplementation,
  encodeCall,
  EdgeToken,
  EdgeTokenProxy,
  EdgeTokenV1,
  EdgeTokenConstructorUpgrade,
  EdgeTokenWhitelistableUpgrade,
  EdgeTokenBlockUnblockTraderUpgrade,
  EdgeTokenDecimalUpgrade,
  EdgeTokenSystemConfiscateUpgrade,
  TWO_ADDRESSES,
  newBool,
  newUint,
};
