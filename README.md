# Solidity-Edge-DCHF-Contracts

**Secure Edge smart contracts used by other Sygnum contracts.** Build on a solid foundation of community-vetted code, utilizing [OpenZeppelin industry standards](https://github.com/OpenZeppelin/openzeppelin-contracts). 

 * [EdgeToken](contracts/edge/EdgeToken.sol) is build using [function overloading](https://solidity.readthedocs.io/en/v0.4.21/contracts.html#function-overloading) principles from [polymorphism](https://en.wikipedia.org/wiki/Polymorphism_(computer_science) within [ERC20 funcions](https://gitlab.com/sygnum/blockchain-engineering/ethereum/solidity-base-contracts/contracts/edge/ERC20/).
 * Utilizes [role-based permissioning](https://gitlab.com/sygnum/blockchain-engineering/ethereum/solidity-base-contracts/contracts/role) scheme from [solidity-base-contracts repo](https://gitlab.com/sygnum/blockchain-engineering/ethereum/solidity-base-contracts/).
 * Exportable [EdgeToken](contracts/edge/EdgeToken.sol) and [EdgeTokenProxy](contracts/edge/EdgeTokenProxy.sol) contract instances usable by other [Gitlab NPM Packages](https://docs.gitlab.com/ee/user/packages/npm_registry/).
 * Audited by [Quantstamp](https://quantstamp.com/) with no major findings.

## Overview

Note: for now this repo only works with NodeJS 10.

### Installation

Obtain a [gitlab access token](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html). Using the `api` scope should suffice.

```console
# Set URL for your scoped packages.
# For example package with name `@sygnum/solidity-edge-dchf-contracts` will use this URL for download
npm config set @sygnum:registry https://gitlab.com/api/v4/packages/npm/

# Add the token for the scoped packages URL. This will allow you to download
# `@sygnum/` packages from private projects.
npm config set '//gitlab.com/api/v4/packages/npm/:_authToken' "<your_access_token>"
```

Now you are able to install and use all private npm packages within the @sygnum gitlab org. 
```console
npm i --save-dev @sygnum/solidity-edge-dchf-contracts
```


### Usage

Once installed, you can use the contracts in the library by importing them:

```solidity
pragma solidity 0.5.0;

import "@sygnum/solidity-edge-dchf-contracts/contracts/edge/EdgeToken.sol";

contract MyContract is EdgeToken {
    constructor() public {
    }
}
```

To keep your system secure, you should **always** use the installed code as-is, and neither copy-paste it from online sources, nor modify it yourself. The library is designed so that only the contracts and functions you use are deployed, so you don't need to worry about it needlessly increasing gas costs.

### Testing

First, install all required packages:  
`npm install`  

Then run:
`npm test`

## Security

This project is maintained by [Sygnum](https://www.sygnum.com/), and developed following our high standards for code quality and security. We take no responsibility for your implementation decisions and any security problems you might experience.

The latest audit was done on November 2020 at commit hash 0bf2c0e1.

Please report any security issues you find to team3301@sygnum.com.

## License

Solidity-Edge-Dchf-Contracts is released under the [MIT License](LICENSE).
