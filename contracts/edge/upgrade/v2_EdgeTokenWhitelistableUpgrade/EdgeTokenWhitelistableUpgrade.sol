/**
 * @title EdgeTokenConstructor
 * @author Team 3301 <team3301@sygnum.com>
 * @dev This contract will the used in the second upgrade done to EDGE for whitelistable integration.
 *      Meaning the token will point to another whitelist contract, and not have a whitelist
 *      integrated into the token itself(i.e. the token being the whitelist).
 */
pragma solidity 0.8.8;

import "../v1_EdgeTokenConstructorUpgrade/EdgeTokenConstructorUpgrade.sol";

contract EdgeTokenWhitelistableUpgrade is EdgeTokenConstructorUpgrade {
    bool public initializedWhitelistableUpgrade;

    error EdgeTokenWhitelistableUpgradeAlreadyInitialized();

    function initializeWhitelist(address _whitelist) public virtual {
        if (initializedWhitelistableUpgrade) revert EdgeTokenWhitelistableUpgradeAlreadyInitialized();

        _setWhitelistContract(_whitelist);
        initializedWhitelistableUpgrade = true;
    }
}
