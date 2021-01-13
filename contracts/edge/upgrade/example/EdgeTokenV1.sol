/**
 * @title EdgeTokenV1
 * @author Team 3301 <team3301@sygnum.com>
 * @dev Standard contract to display upgradability usability.  This is an example contract,
 *      that will not be used in production, to show how upgradability will be utilized.
 */
pragma solidity 0.5.12;

import "../../EdgeToken.sol";

contract EdgeTokenV1 is EdgeToken {
    bool public newBool;
    address public newAddress;
    uint256 public newUint;
    bool public initializedV1;

    function initialize(
        address _operatorsAddr,
        address _whitelist,
        bool _newBool,
        address _newAddress,
        uint256 _newUint
    ) public {
        super.initialize(_operatorsAddr, _whitelist);
        initV1(_newBool, _newAddress, _newUint);
    }

    // changed back to public for tests
    function initV1(
        bool _newBool,
        address _newAddress,
        uint256 _newUint
    ) public {
        require(!initializedV1, "EdgeTokenV1: already initialized");
        newBool = _newBool;
        newAddress = _newAddress;
        newUint = _newUint;
        initializedV1 = true;
    }

    function setNewAddress(address _newAddress) public {
        newAddress = _newAddress;
    }
}
