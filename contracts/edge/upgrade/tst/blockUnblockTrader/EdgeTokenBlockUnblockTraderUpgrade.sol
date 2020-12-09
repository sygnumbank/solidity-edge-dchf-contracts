/**
 * @title EdgeTokenBlockUnblockTraderUpgrade
 * @author Team 3301 <team3301@sygnum.com>
 * @dev This contract will the used in the third upgrade done to EDGE for block/unblock/trader integration.
 */
pragma solidity 0.5.12;

import "../whitelistable/EdgeTokenWhitelistableUpgrade.sol";
import "@sygnum/solidity-base-contracts/contracts/helpers/ERC20/ERC20Blockable.sol";
import "@sygnum/solidity-base-contracts/contracts/helpers/ERC20/ERC20Tradeable.sol";

contract EdgeTokenBlockUnblockTraderUpgrade is EdgeTokenWhitelistableUpgrade, ERC20Blockable, ERC20Tradeable {
    bool public initializedBlockUnblockTraderUpgrade;

    function initializeBlockerTraderOperators(address _blockerOperators, address _traderOperators) public {
        require(!initializedBlockUnblockTraderUpgrade, "EdgeTokenBlockUnblockTraderUpgrade: already initialized");
        _setBlockerOperatorsContract(_blockerOperators);
        _setTraderOperatorsContract(_traderOperators);
        initializedBlockUnblockTraderUpgrade = true;
    }
}
