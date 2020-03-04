pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "@sygnum/solidity-base-contracts/contracts/helpers/Whitelist.sol";


contract ERC20Whitelist is ERC20, Whitelist {
    function transfer(address to, uint256 value) public onlyWhitelisted(msg.sender) onlyWhitelisted(to) returns (bool) {
        return super.transfer(to, value);
    }

    function approve(address spender, uint256 value) public onlyWhitelisted(msg.sender) onlyWhitelisted(spender) returns (bool) {
        return super.approve(spender, value);
    }

    function transferFrom(address from, address to, uint256 value) public onlyWhitelisted(msg.sender) onlyWhitelisted(from) onlyWhitelisted(to) returns (bool) {
        return super.transferFrom(from, to, value);
    }

    function increaseAllowance(address spender, uint addedValue) public onlyWhitelisted(spender) onlyWhitelisted(msg.sender) returns (bool) {
        return super.increaseAllowance(spender, addedValue);
    }

    function decreaseAllowance(address spender, uint subtractedValue) public onlyWhitelisted(spender) onlyWhitelisted(msg.sender) returns (bool) {
        return super.decreaseAllowance(spender, subtractedValue);
    }

    function _burn(address account, uint256 value) internal onlyWhitelisted(account) {
        super._burn(account, value);
    }

    function _burnFrom(address account, uint256 amount) internal onlyWhitelisted(msg.sender) onlyWhitelisted(account) {
        super._burnFrom(account, amount);
    }

    function _mint(address account, uint256 amount) internal onlyWhitelisted(account) {
        super._mint(account, amount);
    }
}