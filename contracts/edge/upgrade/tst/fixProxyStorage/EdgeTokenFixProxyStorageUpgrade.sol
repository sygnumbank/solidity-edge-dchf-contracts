/**
 * @title EdgeTokenFixProxyStorageUpgrade
 * @author Gavin Pacini <gavin.pacini@sygnum.com> 
 * @dev This contract will be used to fix some proxy storage issues.
 */
pragma solidity 0.5.12;

import "../blockUnblockTrader/EdgeTokenBlockUnblockTraderUpgrade.sol";

contract EdgeTokenFixProxyStorageUpgrade is EdgeTokenBlockUnblockTraderUpgrade {
    bool public initializedFixProxyStorageUpgrade;

    function initializeAllExternalContracts(address _whitelist, address _baseOperators, address _blockerOperators, address _traderOperators) public {
        require(!initializedFixProxyStorageUpgrade, "EdgeTokenFixProxyStorageUpgrade: already initialized");
        _setWhitelistContract(_whitelist);
        _setOperatorsContract(_baseOperators);
        _setBlockerOperatorsContract(_blockerOperators);
        _setTraderOperatorsContract(_traderOperators);
        initializedFixProxyStorageUpgrade = true;
    }
}