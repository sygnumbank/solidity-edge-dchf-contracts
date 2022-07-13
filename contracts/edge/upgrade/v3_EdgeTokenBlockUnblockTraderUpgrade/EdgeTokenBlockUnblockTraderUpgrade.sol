/**
 * @title EdgeTokenBlockUnblockTraderUpgrade
 * @author Team 3301 <team3301@sygnum.com>
 * @dev This contract will the used in the third upgrade done to EDGE for block/unblock/trader integration.
 */
pragma solidity 0.8.8;

import "../v2_EdgeTokenWhitelistableUpgrade/EdgeTokenWhitelistableUpgrade.sol";
import "@sygnum/solidity-base-contracts/contracts/helpers/ERC20/ERC20Blockable.sol";
import "@sygnum/solidity-base-contracts/contracts/helpers/ERC20/ERC20Tradeable.sol";

contract EdgeTokenBlockUnblockTraderUpgrade is EdgeTokenWhitelistableUpgrade, ERC20Blockable, ERC20Tradeable {
    bool public initializedBlockUnblockTraderUpgrade;

    error EdgeTokenBlockUnblockTraderUpgradeAlreadyInitialized();

    function initializeBlockerTraderOperators(address _blockerOperators, address _traderOperators) public virtual {
        if (initializedBlockUnblockTraderUpgrade) revert EdgeTokenBlockUnblockTraderUpgradeAlreadyInitialized();
        _setBlockerOperatorsContract(_blockerOperators);
        _setTraderOperatorsContract(_traderOperators);
        initializedBlockUnblockTraderUpgrade = true;
    }

    function _burn(address account, uint256 amount) internal virtual override(EdgeToken, ERC20) {
        EdgeToken._burn(account, amount);
    }

    function _burnFrom(address account, uint256 amount) internal virtual override(EdgeToken, ERC20) {
        EdgeToken._burnFrom(account, amount);
    }

    function _mint(address account, uint256 amount) internal virtual override(EdgeToken, ERC20) {
        EdgeToken._mint(account, amount);
    }

    function approve(address spender, uint256 amount) public virtual override(EdgeToken, ERC20) returns (bool) {
        return EdgeToken.approve(spender, amount);
    }

    function decreaseAllowance(address spender, uint256 subtractedValue)
        public
        virtual
        override(EdgeToken, ERC20)
        returns (bool)
    {
        return EdgeToken.decreaseAllowance(spender, subtractedValue);
    }

    function increaseAllowance(address spender, uint256 addedValue)
        public
        virtual
        override(EdgeToken, ERC20)
        returns (bool)
    {
        return EdgeToken.increaseAllowance(spender, addedValue);
    }

    function initialize(address _baseOperators, address _whitelist)
        public
        virtual
        override(EdgeToken, BlockerOperatorable, TraderOperatorable)
        initializer
    {
        EdgeToken.initialize(_baseOperators, _whitelist);
    }

    function transfer(address recipient, uint256 amount) public virtual override(EdgeToken, ERC20) returns (bool) {
        return EdgeToken.transfer(recipient, amount);
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public virtual override(EdgeToken, ERC20) returns (bool) {
        return EdgeToken.transferFrom(sender, recipient, amount);
    }
}
