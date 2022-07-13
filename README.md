# Solidity-Edge-DCHF-Contracts

**Secure Edge smart contracts backing Sygnum's regulated DCHF token.** Built on a solid foundation of community-vetted code, utilizing [OpenZeppelin industry standards](https://github.com/OpenZeppelin/openzeppelin-contracts).

- [EdgeToken](contracts/edge/EdgeToken.sol) is build using [function overloading](https://solidity.readthedocs.io/en/v0.4.21/contracts.html#function-overloading) principles from [polymorphism](https://en.wikipedia.org/wiki/Polymorphism_computer_science) within [ERC20 functions](https://gitlab.com/sygnum/blockchain-engineering/ethereum/solidity-base-contracts/contracts/edge/ERC20/).
- Utilizes [role-based permissioning](https://gitlab.com/sygnum/blockchain-engineering/ethereum/solidity-base-contracts/-/tree/develop/contracts/role) scheme and a [whitelist](https://gitlab.com/sygnum/blockchain-engineering/ethereum/solidity-base-contracts/-/blob/develop/contracts/helpers/Whitelist.sol) from [solidity-base-contracts repo](https://gitlab.com/sygnum/blockchain-engineering/ethereum/solidity-base-contracts/) to ensure a setup in line with regulatory requirements.
- Exportable [EdgeToken](contracts/edge/EdgeToken.sol) and [EdgeTokenProxy](contracts/edge/EdgeTokenProxy.sol) contract instances usable by other [Gitlab NPM Packages](https://docs.gitlab.com/ee/user/packages/npm_registry/).
- Features a [blocked balance](https://gitlab.com/sygnum/blockchain-engineering/ethereum/solidity-base-contracts/-/blob/develop/contracts/helpers/ERC20/ERC20Blockable.sol) in addition to the standard ERC20 balance (which becomes the available balance) which is useful to block tokens (e.g. for orders on secondary markets) without the need to move them into a separate escrow contract.
- Audited by [Quantstamp](https://quantstamp.com/) with no major findings.

## Overview

The Sygnum EDGE smart contracts are built and designed to enable Ethereum based stablecoins. The [EdgeToken](contracts/edge/EdgeToken.sol) is an ERC20 compatible token which is extended with additional functionality that makes it suitable to operate in a regulated environment. It comes with an integrated role-based model and a whitelist to ensure a setup compliant with regulatory requirements.

[EdgeToken](contracts/edge/EdgeToken.sol) has been specifically designed to support the Digital CHF (DCHF), Sygnum Bank's first stablecoin which is pegged to the Swiss Franc. DCHF can be purchased in a one-to-one exchange for CHF and are redeemable one-to-one for CHF. Upon purchase, DCHF tokens are minted and added to the token supply. Upon redemption, DCHF tokens are burned from the supply. The Digital CHF is available for purchase on Sygnum's banking platform.

The token comes with a [proxy](contracts/edge/EdgeTokenProxy.sol) contract, which enables a future-proof setup with the possibility upgrade the token functionality without the need to deploy a new contract.

The [EdgeToken](contracts/edge/EdgeToken.sol) is initialized with a whitelist contract and several role contracts (base, trader, blockers).

### Functions

An overview of the most important extensions of the EDGE token can be found below.

`mint`: increase the supply by minting a specified amount of tokens to an address. Alternatively, `batchMint` can be used to mint up to 256 addresses in a single batch. Can only be called by Operator or System.

`burn`: decrease the supply by a specified amount from the account of msg.sender. Alternatively, `burnFor` can be used to burn an amount of tokens for a specific address. Can only be called by Operator or System.

`pause`: halt all interactions with the smart contract by pausing the token. Can only be called by Operator.

`unpause`: re-enable interactions with the smart contract by unpausing a paused token. Can only be called by Operator.

`freeze`: stop a particular address from interacting with the smart contract. Can only be called by Operator. This function can be used to carry out enforcements of court rulings or other situations where regulations require intervention of the service provider (e.g. AML).

`unfreeze`: re-enable a particular frozen address to interact with the smart contract. Can only be called by Operator.

`confiscate`: transfer a specified amount of tokens from one address to a target address. Alternatively, `batchConfiscate` can be used to combine up to 256 confiscations in a single batch. Can only be called by Operator. This function can be used to carry out enforcements of court rulings or other situations where regulations require intervention of the service provider (e.g. AML).

`block`: transfer a specified amount of tokens from an account’s available balance ( balanceOf() ) to its blocked balance ( blockedBalanceOf() ). Can only be called by Blocker or Operator. This function can be used to block funds which are “in order” on a secondary market or held in escrow for other purposes (e.g. lending services), while at the same time ensuring that the tokens remain in the account and name of the token holder.

`unblock`: transfer a specified amount of tokens from an account’s blocked balance ( `blockedBalanceOf()` ) to its available balance ( `balanceOf()` ). Can only be called by Blocker or Operator.

### Installation

Note: for now this repo only works with NodeJS 16.

To use Node Version Manager (nvm), this repo has a .nvmrc file.

```console
nvm use

# Only required if specified node version is not installed
nvm install
```

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
pragma solidity 0.8.8;

import "@sygnum/solidity-edge-dchf-contracts/contracts/edge/EdgeToken.sol";

contract MyContract is EdgeToken {
  constructor() public {}
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
