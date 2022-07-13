/* eslint-disable no-await-in-loop */
require("dotenv").config();

const { ethers } = require("hardhat");
const { encodeCall } = require("@openzeppelin/upgrades");

const {
  BASE_OPERATORS_CONTRACT_ADDRESS,
  WHITELIST_CONTRACT_ADDRESS,
  TRADER_OPERATORS_CONTRACT_ADDRESS,
  BLOCKER_OPERATORS_CONTRACT_ADDRESS,
  PROXY_ADMIN,
} = require("../config/deployment");

const EdgeToken = "EdgeToken";
const EdgeTokenConstructorUpgrade = "EdgeTokenConstructorUpgrade";
const EdgeTokenWhitelistableUpgrade = "EdgeTokenWhitelistableUpgrade";
const EdgeTokenBlockUnblockTraderUpgrade = "EdgeTokenBlockUnblockTraderUpgrade";
const EdgeTokenDecimalUpgrade = "EdgeTokenDecimalUpgrade";
const EdgeTokenSystemConfiscateUpgrade = "EdgeTokenSystemConfiscateUpgrade";
const EdgeTokenProxy = "EdgeTokenProxy";

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const deployingGasAmount = Number(process.env.DEPLOYING_GAS_AMOUNT);
  const confirmations = Number(process.env.CONFIRMATIONS);

  console.log(`Deploying Account Address: ${deployer}`);
  const _address = {};

  // Deploy EdgeToken basic implementation
  const edgeTokenDeployment = await deploy(EdgeToken, {
    from: deployer,
    gasLimit: deployingGasAmount,
    log: true,
  });

  if (edgeTokenDeployment.transactionHash) {
    await ethers.provider.waitForTransaction(edgeTokenDeployment.transactionHash, confirmations);
  }

  _address[EdgeToken] = edgeTokenDeployment.address;

  // Deploy the proxy contract
  const initializeData = encodeCall("initialize", ["address", "address"], [BASE_OPERATORS_CONTRACT_ADDRESS, WHITELIST_CONTRACT_ADDRESS]);

  const edgeTokenProxyDeployment = await deploy(EdgeTokenProxy, {
    from: deployer,
    gasLimit: deployingGasAmount,
    args: [_address[EdgeToken], deployer, initializeData],
    log: true,
  });

  if (edgeTokenProxyDeployment.transactionHash) {
    await ethers.provider.waitForTransaction(edgeTokenProxyDeployment.transactionHash, confirmations);
  }

  const EdgeTokenProxyArtifact = await ethers.getContractFactory(EdgeTokenProxy, deployer);
  const edgeTokenProxyInstance = await EdgeTokenProxyArtifact.attach(edgeTokenProxyDeployment.address);

  // console.log(edgeTokenProxyInstance);

  _address[EdgeTokenProxy] = edgeTokenProxyDeployment.address;

  // Prepare the calldata for each sequential upgrade
  const data = {
    [EdgeTokenConstructorUpgrade]: encodeCall("initializeConstructor"),
    [EdgeTokenWhitelistableUpgrade]: encodeCall("initializeWhitelist", ["address"], [WHITELIST_CONTRACT_ADDRESS]),
    [EdgeTokenBlockUnblockTraderUpgrade]: encodeCall(
      "initializeBlockerTraderOperators",
      ["address", "address"],
      [BLOCKER_OPERATORS_CONTRACT_ADDRESS, TRADER_OPERATORS_CONTRACT_ADDRESS]
    ),
    [EdgeTokenDecimalUpgrade]: encodeCall("initializeDecimalsConstructor"),
    [EdgeTokenSystemConfiscateUpgrade]: encodeCall("initializeSystemConfiscateConstructor"),
  };

  // Deploying the multiple contracts together and sequentially upgrading in this loop
  // eslint-disable-next-line no-restricted-syntax
  for (const contractName of [
    EdgeTokenConstructorUpgrade,
    EdgeTokenWhitelistableUpgrade,
    EdgeTokenBlockUnblockTraderUpgrade,
    EdgeTokenDecimalUpgrade,
    EdgeTokenSystemConfiscateUpgrade,
  ]) {
    const deployment = await deploy(contractName, {
      from: deployer,
      gasLimit: deployingGasAmount,
      log: true,
    });

    if (deployment.transactionHash) {
      await ethers.provider.waitForTransaction(deployment.transactionHash, confirmations);
    }

    _address[contractName] = deployment.address;

    try {
      const upgradeTx = await edgeTokenProxyInstance.upgradeToAndCall(_address[contractName], data[contractName]);
      await upgradeTx.wait();
    } catch (e) {
      console.log(e);
    }
  }

  // Change the proxy admin from deployer to PROXY_ADMIN
  try {
    const proxyAdminTx = await edgeTokenProxyInstance.changeAdmin(PROXY_ADMIN);
    await proxyAdminTx.wait();

    console.log("Admin successfully changed to", PROXY_ADMIN);
  } catch (e) {
    console.log(e);
  }

  console.table({
    Deployer: deployer,
    EdgeTokenProxy: _address[EdgeTokenProxy],
    EdgeToken: _address[EdgeToken],
    EdgeTokenConstructorUpgrade: _address[EdgeTokenConstructorUpgrade],
    EdgeTokenWhitelistableUpgrade: _address[EdgeTokenWhitelistableUpgrade],
    EdgeTokenBlockUnblockTraderUpgrade: _address[EdgeTokenWhitelistableUpgrade],
    EdgeTokenDecimalUpgrade: _address[EdgeTokenDecimalUpgrade],
    EdgeTokenSystemConfiscateUpgrade: _address[EdgeTokenSystemConfiscateUpgrade],
  });
};

module.exports.tags = ["All"];
