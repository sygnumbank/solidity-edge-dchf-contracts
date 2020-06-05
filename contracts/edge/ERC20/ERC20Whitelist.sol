pragma solidity 0.5.12;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "@sygnum/solidity-base-contracts/contracts/helpers/Whitelist.sol";


contract ERC20Whitelist is ERC20, Whitelist {
    function transfer(address to, uint256 value) public whenWhitelisted(msg.sender) whenWhitelisted(to) returns (bool) {
        return super.transfer(to, value);
    }

    function approve(address spender, uint256 value) public whenWhitelisted(msg.sender) whenWhitelisted(spender) returns (bool) {
        return super.approve(spender, value);
    }

    function transferFrom(address from, address to, uint256 value) public whenWhitelisted(msg.sender) whenWhitelisted(from) whenWhitelisted(to) returns (bool) {
        return super.transferFrom(from, to, value);
    }

    function increaseAllowance(address spender, uint addedValue) public whenWhitelisted(spender) whenWhitelisted(msg.sender) returns (bool) {
        return super.increaseAllowance(spender, addedValue);
    }

    function decreaseAllowance(address spender, uint subtractedValue) public whenWhitelisted(spender) whenWhitelisted(msg.sender) returns (bool) {
        return super.decreaseAllowance(spender, subtractedValue);
    }

    function _burn(address account, uint256 value) internal whenWhitelisted(account) {
        super._burn(account, value);
    }

    function _burnFrom(address account, uint256 amount) internal whenWhitelisted(msg.sender) whenWhitelisted(account) {
        super._burnFrom(account, amount);
    }

    function _mint(address account, uint256 amount) internal whenWhitelisted(account) {
        super._mint(account, amount);
    }
}