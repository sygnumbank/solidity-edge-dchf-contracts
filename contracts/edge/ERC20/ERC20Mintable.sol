pragma solidity 0.5.12;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "@sygnum/solidity-base-contracts/contracts/role/base/Operatorable.sol";


contract ERC20Mintable is ERC20, Operatorable {
    function _mint(address account, uint256 amount) internal onlyOperatorOrSystem {
        require(amount > 0, 'ERC20Mintable: amount has to be greater than 0');
        super._mint(account, amount);
    }
}