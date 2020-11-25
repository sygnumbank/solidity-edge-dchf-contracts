/**
 * @title EdgeTokenProxy
 * @author Connor Howe <connor.howe@sygnum.com>
 * @dev Proxies EdgeToken calls and enables EdgeToken upgradability.
 */
pragma solidity 0.5.12;

import "zos-lib/contracts/upgradeability/AdminUpgradeabilityProxy.sol";

contract EdgeTokenProxy is AdminUpgradeabilityProxy {
    /* solhint-disable no-empty-blocks */
    constructor(
        address implementation,
        address proxyOwnerAddr,
        bytes memory data
    ) public AdminUpgradeabilityProxy(implementation, proxyOwnerAddr, data) {}
    /* solhint-enable no-empty-blocks */
}
