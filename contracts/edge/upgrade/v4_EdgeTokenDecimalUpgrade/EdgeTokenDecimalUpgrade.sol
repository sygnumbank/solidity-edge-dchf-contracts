/**
 * @title EdgeTokenDecimalUpgrade
 * @author Team 3301 <team3301@sygnum.com>
 * @dev This contract will be used in the second version of upgrading the EdgeToken to change the decimals value from 2
 *      to 6. Additionally, as '_decimals' was declared private, the getter function 'decimals()' required to be
 *      overloaded to point to the correct/new/overloaded variables.
 */
pragma solidity 0.8.8;

import "../v3_EdgeTokenBlockUnblockTraderUpgrade/EdgeTokenBlockUnblockTraderUpgrade.sol";

contract EdgeTokenDecimalUpgrade is EdgeTokenBlockUnblockTraderUpgrade {
    uint8 private _decimals;
    bool public initializedDecimalUpgrade;

    error EdgeTokenDecimalUpgradeAlreadyInitialized();

    function initializeDecimalsConstructor() public virtual {
        if (initializedDecimalUpgrade) revert EdgeTokenDecimalUpgradeAlreadyInitialized();
        _decimals = 6;
        initializedDecimalUpgrade = true;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `6`, a balance of `505` tokens should
     * be displayed to a user as `5,05` (`505 / 10 ** 6`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}
