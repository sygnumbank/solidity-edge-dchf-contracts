/**
 * @title EdgeToken
 * @author Connor Howe <connor.howe@sygnum.com>
 * @dev EdgeToken is a ERC20 token that is upgradable and pausable.
 *      User addresses require to be whitelisted for transfers
 *      to execute.  Addresses can be frozen, and funds from
 *      particular addresses can be confiscated.
 */
pragma solidity 0.5.12;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";

import "@sygnum/solidity-base-contracts/contracts/helpers/ERC20/ERC20Whitelist.sol";
import "@sygnum/solidity-base-contracts/contracts/helpers/ERC20/ERC20Pausable.sol";
import "@sygnum/solidity-base-contracts/contracts/helpers/ERC20/ERC20Freezable.sol";
import "@sygnum/solidity-base-contracts/contracts/helpers/ERC20/ERC20Mintable.sol";
import "@sygnum/solidity-base-contracts/contracts/helpers/ERC20/ERC20Burnable.sol";
import "@sygnum/solidity-base-contracts/contracts/helpers/Initializable.sol";


contract EdgeToken is ERC20, ERC20Detailed("Digital CHF", "DCHF", 2), Initializable, ERC20Whitelist,
                        ERC20Pausable, ERC20Freezable, ERC20Mintable, ERC20Burnable {

    event Minted(address indexed minter, address indexed account, uint256 value);
    event Burned(address indexed burner, uint256 value);
    event BurnedFor(address indexed burner, address indexed account, uint256 value);

    uint16 constant BATCH_LIMIT = 256;

    /**
     * @dev Initialization instead of constructor, only called once.
     * @param _baseOperators Address of baseOperators contract.
     */
    function initialize(address _baseOperators) public initializer {
        super.initialize(_baseOperators);
    }

    // function initialize(address _baseOperators, address _whitelist) public initializer {
    //     super.initialize(_baseOperators, _whitelist);
    // }



    /**
    * @dev Burn.
    * @param _amount Amount of tokens to burn.
    */
    function burn(uint256 _amount) public {
        require(!isFrozen(msg.sender), "EdgeToken: Account must not be frozen");
        super._burn(msg.sender, _amount);
        emit Burned(msg.sender, _amount);
    }

    /**
    * @dev BurnFor.
    * @param _account Account to burn tokens from.
    * @param _amount Amount of tokens to burn.
    */
    function burnFor(address _account, uint256 _amount) public {
        super._burnFor(_account, _amount);
        emit BurnedFor(msg.sender, _account, _amount);
    }

    /**
    * @dev burnFrom.
    * @param _account Account to burn from.
    * @param _amount Amount of tokens to burn.
    */
    function burnFrom(address _account, uint256 _amount) public {
        super._burnFrom(_account, _amount);
        emit Burned(_account, _amount);
    }

    /**
    * @dev Mint.
    * @param _account Address to mint tokens to.
    * @param _amount Amount to mint.
    */
    function mint(address _account, uint256 _amount) public {
        if(isSystem(msg.sender)){
            require(!isFrozen(_account), 'EdgeToken: Account must be frozen if system calling.');
        }
        super._mint(_account, _amount);
        emit Minted(msg.sender, _account, _amount);
    }

    /**
    * @dev confiscate.
    * @param _confiscatee Account to confiscate funds from.
    * @param _receiver Account to transfer confiscated funds too.
    * @param _amount Amount of tokens to burn.
    */
    function confiscate(address _confiscatee, address _receiver, uint256 _amount)
        public
        onlyOperator
        whenNotPaused
        whenWhitelisted(_receiver)
        whenWhitelisted(_confiscatee)
    {
        super._transfer(_confiscatee, _receiver, _amount);
     }

    /**
     * @dev Batch burn from an operator or admin address.
     * @param _recipients Array of recipient addresses.
     * @param _values Array of amount to burn.
     */
    function batchBurnFor(address[] memory _recipients, uint256[] memory _values) public returns (bool) {
        require(_recipients.length == _values.length, "EdgeToken: values and recipients are not equal.");
        require(_recipients.length <= BATCH_LIMIT, "EdgeToken: batch count is greater than BATCH_LIMIT.");
        for(uint256 i = 0; i < _recipients.length; i++) {
            burnFor(_recipients[i], _values[i]);
        }
    }

     /**
     * @dev Batch mint to a maximum of 255 addresses, for a custom amount for each address.
     * @param _recipients Array of recipient addresses.
     * @param _values Array of amount to mint.
     */
    function batchMint(address[] memory _recipients, uint256[] memory _values) public returns (bool) {
        require(_recipients.length == _values.length, "EdgeToken: values and recipients are not equal.");
        require(_recipients.length <= BATCH_LIMIT, "EdgeToken: greater than BATCH_LIMIT.");
        for(uint256 i = 0; i < _recipients.length; i++) {
            mint(_recipients[i], _values[i]);
        }
    }

     /**
    * @dev Batch confiscate to a macimum of 255 addresses. 
    * @param _confiscatees array addresses who's funds are being confiscated
    * @param _receivers array addresses who's receiving the funds
    * @param _values array of values of funds being confiscated
    */
    function batchConfiscate(address[] memory _confiscatees, address[] memory _receivers, uint256[] memory _values) public returns (bool) {
        require(_confiscatees.length == _values.length && _receivers.length == _values.length, "EdgeToken: values and recipients are not equal");
        require(_confiscatees.length <= BATCH_LIMIT, "EdgeToken: batch count is greater than BATCH_LIMIT");
        for(uint256 i = 0; i < _confiscatees.length; i++) {
            confiscate(_confiscatees[i], _receivers[i], _values[i]);
        }
    }
}
