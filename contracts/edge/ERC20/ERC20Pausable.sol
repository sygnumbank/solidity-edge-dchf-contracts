pragma solidity 0.5.12;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "@sygnum/solidity-base-contracts/contracts/helpers/Pausable.sol";


contract ERC20Pausable is ERC20, Pausable {
   function transfer(address to, uint256 value) public whenNotPaused returns (bool) {
        return super.transfer(to, value);
    }

    function approve(address spender, uint256 value) public whenNotPaused returns (bool) {
        return super.approve(spender, value);
    }

    function transferFrom(address from, address to, uint256 value) public whenNotPaused returns (bool) {
        return super.transferFrom(from, to, value);
    }

    function increaseAllowance(address spender, uint addedValue) public whenNotPaused returns (bool) {
        return super.increaseAllowance(spender, addedValue);
    }

    function decreaseAllowance(address spender, uint subtractedValue) public whenNotPaused returns (bool) {
        return super.decreaseAllowance(spender, subtractedValue);
    }

    function _burn(address account, uint256 value) internal whenNotPaused {
        super._burn(account, value);
    }

    function _burnFrom(address account, uint256 amount) internal whenNotPaused {
        super._burnFrom(account, amount);
    }

    function _mint(address account, uint256 amount) internal whenNotPaused {
        super._mint(account, amount);
    }
}
