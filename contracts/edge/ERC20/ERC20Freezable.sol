pragma solidity 0.5.12;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "@sygnum/solidity-base-contracts/contracts/helpers/Freezable.sol";


contract ERC20Freezable is ERC20, Freezable {
   function transfer(address to, uint256 value) public whenNotFrozen(msg.sender) whenNotFrozen(to) returns (bool) {
        return super.transfer(to, value);
    }

    function approve(address spender, uint256 value) public whenNotFrozen(msg.sender) whenNotFrozen(spender) returns (bool) {
        return super.approve(spender, value);
    }

    function transferFrom(address from, address to, uint256 value) public whenNotFrozen(msg.sender) whenNotFrozen(from) whenNotFrozen(to) returns (bool) {
        return super.transferFrom(from, to, value);
    }

    function increaseAllowance(address spender, uint addedValue) public whenNotFrozen(msg.sender) whenNotFrozen(spender) returns (bool) {
        return super.increaseAllowance(spender, addedValue);
    }

    function decreaseAllowance(address spender, uint subtractedValue) public whenNotFrozen(msg.sender) whenNotFrozen(spender) returns (bool) {
        return super.decreaseAllowance(spender, subtractedValue);
    }

    function _burnFrom(address account, uint256 amount) internal whenNotFrozen(msg.sender) whenNotFrozen(account) {
        super._burnFrom(account, amount);
    }
}
