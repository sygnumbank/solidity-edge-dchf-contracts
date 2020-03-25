pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "@sygnum/solidity-base-contracts/contracts/role/Operatorable.sol";

contract ERC20Burnable is ERC20, Operatorable {
    function _burnFor(address account, uint256 amount) internal onlyOperator {
        super._burn(account, amount);
    }
}
