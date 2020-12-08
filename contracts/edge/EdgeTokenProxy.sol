/**
 * @title EdgeTokenProxy
 * @author Team 3301 <team3301@sygnum.com>
 * @dev Proxies EdgeToken calls and enables EdgeToken upgradability.
 */
pragma solidity 0.5.12;

import "zos-lib/contracts/upgradeability/AdminUpgradeabilityProxy.sol";

contract EdgeTokenProxy is AdminUpgradeabilityProxy {
    constructor(
        address implementation,
        address proxyOwnerAddr,
        bytes memory data
    ) public AdminUpgradeabilityProxy(implementation, proxyOwnerAddr, data) {}
}
