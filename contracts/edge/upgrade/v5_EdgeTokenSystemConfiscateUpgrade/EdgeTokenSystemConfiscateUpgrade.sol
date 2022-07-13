/**
 * @title EdgeTokenDecimalUpgrade
 * @author Team 3301 <team3301@sygnum.com>
 * @dev This contract will be used to allow system to use the confiscate tokens as well,
 * versus only operators previously.
 */
pragma solidity 0.8.8;

import "../v4_EdgeTokenDecimalUpgrade/EdgeTokenDecimalUpgrade.sol";

contract EdgeTokenSystemConfiscateUpgrade is EdgeTokenDecimalUpgrade {
    bool public initializedSystemConfiscate;

    error EdgeTokenSystemConfiscateUpgradeAlreadyInitialized();

    function initializeSystemConfiscateConstructor() public virtual {
        if (initializedSystemConfiscate) revert EdgeTokenSystemConfiscateUpgradeAlreadyInitialized();
        initializedSystemConfiscate = true;
    }

    /**
     * @dev initializeFromScratch, to be called when redeploying
     * the contract from scratch. Calls all constructors sequentially.
     * @param _whitelist Whitelist address
     * @param _blockerOperators Blocker operators contract address
     * @param _traderOperators Trader operators contract address
     */

    function initialize(
        address _baseOperators,
        address _whitelist,
        address _blockerOperators,
        address _traderOperators
    ) public virtual initializer {
        Operatorable.initialize(_baseOperators);
        initializeConstructor();
        initializeWhitelist(_whitelist);
        initializeBlockerTraderOperators(_blockerOperators, _traderOperators);
        initializeDecimalsConstructor();
        initializeSystemConfiscateConstructor();
    }

    /**
     * @dev confiscate.
     * @param _confiscatee Account to confiscate funds from.
     * @param _receiver Account to transfer confiscated funds too.
     * @param _amount Amount of tokens to burn.
     */
    function confiscate(
        address _confiscatee,
        address _receiver,
        uint256 _amount
    )
        public
        virtual
        override
        onlyOperatorOrSystem
        whenNotPaused
        whenWhitelisted(_receiver)
        whenWhitelisted(_confiscatee)
    {
        super._transfer(_confiscatee, _receiver, _amount);
    }
}
