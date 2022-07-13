/**
 * @title EdgeToken
 * @author Team 3301 <team3301@sygnum.com>
 * @dev EdgeToken is a ERC20 token that is upgradable and pausable.
 *      User addresses require to be whitelisted for transfers
 *      to execute.  Addresses can be frozen, and funds from
 *      particular addresses can be confiscated.
 */
pragma solidity 0.8.8;

import "./ERC20Detailed.sol";

import "@sygnum/solidity-base-contracts/contracts/helpers/ERC20/ERC20Overload/ERC20.sol";
import "@sygnum/solidity-base-contracts/contracts/helpers/ERC20/ERC20Whitelist.sol";
import "@sygnum/solidity-base-contracts/contracts/helpers/ERC20/ERC20Pausable.sol";
import "@sygnum/solidity-base-contracts/contracts/helpers/ERC20/ERC20Freezable.sol";
import "@sygnum/solidity-base-contracts/contracts/helpers/ERC20/ERC20Mintable.sol";
import "@sygnum/solidity-base-contracts/contracts/helpers/ERC20/ERC20Burnable.sol";
import "@sygnum/solidity-base-contracts/contracts/helpers/Initializable.sol";

contract EdgeToken is
    ERC20,
    ERC20Detailed("Digital CHF", "DCHF", 2),
    Initializable,
    ERC20Pausable,
    ERC20Whitelist,
    ERC20Freezable,
    ERC20Mintable,
    ERC20Burnable
{
    /**
     * @dev Error: "EdgeToken: Account must not be frozen"
     */
    error EdgeTokenAccountFrozen(address _account);

    /**
     * @dev Error: "EdgeToken: Account must be frozen if system calling."
     */
    error EdgeTokenSystemCallingUnfrozenAccount(address _account);

    /**
     * @dev Error: "EdgeToken: values and recipients are not equal."
     */
    error EdgeTokenUnequalArrayLengths();

    /**
     * @dev Error: "EdgeToken: batch count is greater than BATCH_LIMIT"
     */
    error EdgeTokenBatchLimitExceeded();

    event Minted(address indexed minter, address indexed account, uint256 value);
    event Burned(address indexed burner, uint256 value);
    event BurnedFor(address indexed burner, address indexed account, uint256 value);

    uint16 internal constant BATCH_LIMIT = 256;

    /**
     * @dev Initialization instead of constructor, only called once.
     * @param _baseOperators Address of baseOperators contract.
     * @param _whitelist Address of whitelist contract.
     */
    function initialize(address _baseOperators, address _whitelist)
        public
        virtual
        override(Whitelistable, TraderOperatorable)
        initializer
    {
        super.initialize(_baseOperators, _whitelist);
    }

    /**
     * @dev Burn.
     * @param _amount Amount of tokens to burn.
     */
    function burn(uint256 _amount) public virtual {
        if (isFrozen(msg.sender)) revert EdgeTokenAccountFrozen(msg.sender);

        _burn(msg.sender, _amount);
        emit Burned(msg.sender, _amount);
    }

    /**
     * @dev BurnFor.
     * @param _account Account to burn tokens from.
     * @param _amount Amount of tokens to burn.
     */
    function burnFor(address _account, uint256 _amount) public virtual {
        _burnFor(_account, _amount);
        emit BurnedFor(msg.sender, _account, _amount);
    }

    /**
     * @dev burnFrom.
     * @param _account Account to burn from.
     * @param _amount Amount of tokens to burn.
     */
    function burnFrom(address _account, uint256 _amount) public virtual {
        _burnFrom(_account, _amount);
        emit Burned(_account, _amount);
    }

    /**
     * @dev Mint.
     * @param _account Address to mint tokens to.
     * @param _amount Amount to mint.
     */
    function mint(address _account, uint256 _amount) public virtual {
        if (isSystem(msg.sender)) {
            if (isFrozen(_account)) revert EdgeTokenSystemCallingUnfrozenAccount(_account);
        }
        _mint(_account, _amount);
        emit Minted(msg.sender, _account, _amount);
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
    ) public virtual onlyOperator whenNotPaused whenWhitelisted(_receiver) whenWhitelisted(_confiscatee) {
        _transfer(_confiscatee, _receiver, _amount);
    }

    /**
     * @dev Batch burn from an operator or admin address.
     * @param _recipients Array of recipient addresses.
     * @param _values Array of amount to burn.
     */
    function batchBurnFor(address[] memory _recipients, uint256[] memory _values) public virtual {
        if (_recipients.length != _values.length) revert EdgeTokenUnequalArrayLengths();
        if (_recipients.length > BATCH_LIMIT) revert EdgeTokenBatchLimitExceeded();

        for (uint256 i = 0; i < _recipients.length; ++i) {
            burnFor(_recipients[i], _values[i]);
        }
    }

    /**
     * @dev Batch mint to a maximum of 255 addresses, for a custom amount for each address.
     * @param _recipients Array of recipient addresses.
     * @param _values Array of amount to mint.
     */
    function batchMint(address[] memory _recipients, uint256[] memory _values) public virtual {
        if (_recipients.length != _values.length) revert EdgeTokenUnequalArrayLengths();
        if (_recipients.length > BATCH_LIMIT) revert EdgeTokenBatchLimitExceeded();

        for (uint256 i = 0; i < _recipients.length; ++i) {
            mint(_recipients[i], _values[i]);
        }
    }

    /**
     * @dev Batch confiscate to a maximum of 255 addresses.
     * @param _confiscatees array addresses who's funds are being confiscated
     * @param _receivers array addresses who's receiving the funds
     * @param _values array of values of funds being confiscated
     */
    function batchConfiscate(
        address[] memory _confiscatees,
        address[] memory _receivers,
        uint256[] memory _values
    ) public virtual {
        if (_confiscatees.length != _values.length || _receivers.length != _values.length)
            revert EdgeTokenUnequalArrayLengths();
        if (_confiscatees.length > BATCH_LIMIT) revert EdgeTokenBatchLimitExceeded();

        for (uint256 i = 0; i < _confiscatees.length; ++i) {
            confiscate(_confiscatees[i], _receivers[i], _values[i]);
        }
    }

    // FORCE OVERRIDE FUNCTIONS
    function transferFrom(
        address from,
        address to,
        uint256 value
    )
        public
        virtual
        override(ERC20, ERC20Freezable, ERC20Snapshot, ERC20Whitelist, IERC20, ERC20Pausable)
        returns (bool)
    {
        return super.transferFrom(from, to, value);
    }

    function transfer(address to, uint256 value)
        public
        virtual
        override(ERC20, ERC20Freezable, ERC20Snapshot, ERC20Whitelist, IERC20, ERC20Pausable)
        returns (bool)
    {
        return super.transfer(to, value);
    }

    function increaseAllowance(address spender, uint256 addedValue)
        public
        virtual
        override(ERC20, ERC20Freezable, ERC20Whitelist, ERC20Pausable)
        returns (bool)
    {
        return super.increaseAllowance(spender, addedValue);
    }

    function decreaseAllowance(address spender, uint256 subtractedValue)
        public
        virtual
        override(ERC20, ERC20Freezable, ERC20Whitelist, ERC20Pausable)
        returns (bool)
    {
        return super.decreaseAllowance(spender, subtractedValue);
    }

    function approve(address spender, uint256 value)
        public
        virtual
        override(ERC20, IERC20, ERC20Freezable, ERC20Whitelist, ERC20Pausable)
        returns (bool)
    {
        return super.approve(spender, value);
    }

    function _burn(address account, uint256 value)
        internal
        virtual
        override(ERC20, ERC20Snapshot, ERC20Whitelist, ERC20Pausable)
    {
        super._burn(account, value);
    }

    /**
     * @dev Overload _burnFrom function to ensure contract has not been paused.
     * @param account address that funds will be burned from allowance.
     * @param amount amount of funds that will be burned.
     */
    function _burnFrom(address account, uint256 amount)
        internal
        virtual
        override(ERC20, ERC20Snapshot, ERC20Whitelist, ERC20Freezable, ERC20Pausable)
    {
        super._burnFrom(account, amount);
    }

    /**
     * @dev Overload _mint function to ensure contract has not been paused.
     * @param account address that funds will be minted to.
     * @param amount amount of funds that will be minted.
     */
    function _mint(address account, uint256 amount)
        internal
        virtual
        override(ERC20, ERC20Snapshot, ERC20Whitelist, ERC20Mintable, ERC20Pausable)
    {
        super._mint(account, amount);
    }

    function _burnFor(address account, uint256 amount) internal virtual override(ERC20Burnable) {
        super._burnFor(account, amount);
    }
}
