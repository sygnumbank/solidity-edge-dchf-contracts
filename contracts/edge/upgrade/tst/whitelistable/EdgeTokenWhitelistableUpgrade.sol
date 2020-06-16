/**
 * @title EdgeTokenConstructor
 * @author Connor Howe <connor.howe@sygnum.com> 
 * @dev This contract will the used in the second upgrade done to EDGE for whitelistable integration.
 *      Meaning the token will point to another whitelist contract, and not have a whitelist
 *      integrated into the token itself(i.e. the token being the whitelist).
 */
pragma solidity 0.5.12;

import "../../../EdgeToken.sol";

contract EdgeTokenWhitelistableUpgrade is EdgeToken {
    bool public initializedWhitelistableUpgrade;

    function initializeWhitelist(address _whitelist) public {
      require(!initializedWhitelistableUpgrade, "EdgeTokenWhitelistableUpgrade: already initialized");
      _setWhitelistContract(_whitelist);
      initializedWhitelistableUpgrade = true;
    }
}