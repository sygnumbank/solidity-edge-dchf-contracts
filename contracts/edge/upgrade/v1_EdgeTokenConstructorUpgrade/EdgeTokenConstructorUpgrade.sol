/**
 * @title EdgeTokenConstructor
 * @author Team 3301 <team3301@sygnum.com>
 * @dev This contract will be used in the first version of upgrading the EdgeToken to mitigate
 *      variables initialized in EdgeToken.sol constructor '_name, _symbol, _decimals' that are
 *      not initialized inside of EdgeTokenProxy.sol.  Additionally, as '_name, symbol, _decimals'
 *      were declared private, the getter functions 'name(), symbol(), decimals()' required to be
 *      overloaded to point to the correct/new/overloaded variables.
 */
pragma solidity 0.5.12;

import "../../EdgeToken.sol";

contract EdgeTokenConstructorUpgrade is EdgeToken {
    string private _name;
    string private _symbol;
    uint8 private _decimals;
    bool public initializedConstructorUpgrade;

    function initializeConstructor() public {
        require(!initializedConstructorUpgrade, "EdgeTokenConstructorUpgrade: already initialized");
        _name = "Digital CHF";
        _symbol = "DCHF";
        _decimals = 2;
        initializedConstructorUpgrade = true;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5,05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view returns (uint8) {
        return _decimals;
    }
}
