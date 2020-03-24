# EDGE smart contracts

![](UML.svg)

## Deployment of smart contracts

### Local Deployment

```
yarn
```    

In one console run:   
``` 
yarn ganache-cli -a 20
```    

``` 
yarn truffle test
```

and for coverage:
```
yarn coverage
```

### Prerequisites
* Truffle installed ([link]( https://www.trufflesuite.com/truffle))

### Specify environment variables in .env file
1. Create a new file `.env` in the project's root directory. Use the example file [.env.example](./.env.example) as a template.

2. Adjust the parameters:
* `MNENOMIC` : seed phrase (metamask's recovery words)
* `INFURA_API_KEY`: API key from Infura (infura.io)
* `PROXY_ADMIN`: Address of administrator that can upgrade the token contract to a new version (to new logic) 
* `TOKEN_ADMIN`: Address of the administrator who manages EDGE system. Do not use the same address for `PROXY_ADMIN` and `TOKEN_ADMIN`.
* `REDEPLOY_OPERATORS`: true = new operators contract will be deployed / false = reuse previous deployed [operators smart contract](./contracts/role/BaseOperators.sol).
* `OPERATORS_CONTRACT_ADDR`: Address of [operators smart contract](./contract/role/BaseOperators.sol). Will only be used if `REDEPLOY_OPERATORS`=false. If `REDEPLOY_OPERATORS`=true this will be ignored. 

### Deployment
1.  Launch the Truffle console in the project's root directory:
```
truffle console --network ropsten
```

or for deploying to main network:

```
truffle console --network main
```

2. To run your migrations, run the following:
```
migrate --reset
```
This will run all deployment scripts located within the project's migrations directory. `--reset` option to run all your migrations from the beginning.

### Redeployment


If the logic for edge token implementation contract should be changed when it is already in production (main network) with the condition that address of EdgeTokenProxy and storage should remain the same - the edge token should be upgraded in such steps:


1.  develop the new contract (e.g. EdgeTokenV1) which extends(!very important) previous implementation of EdgeToken contract (the example is `/contracts/EdgeToken/EdgeTokenV1.sol`)

2.  deploy new version of EdgeToken contract and call upgradeTo(newImplementationAddress) function in proxy contract to set up new address of edgeToken logic. The example of script for upgrading EdgeToken to new logic (should be initiated by proxyAdmin):

**3_upgrade_token_logic.js** 


```js
let EdgeTokenV1 = artifacts.require("./EdgeToken/EdgeTokenV1.sol");
let EdgeTokenProxy = artifacts.require("./EdgeToken/EdgeTokenProxy.sol");
const encodeCall = require("../node_modules/zos-lib/lib/helpers/encodeCall");
const {RANDOM_ADDRESS} = require('./helpers/common')

module.exports = function(deployer, network, accounts) {
    var edgeTokenProxy;
    var edgeTokenImpl1;
    var proxyAdmin;

    
    if( network == "ropsten" || network == "main") {
        proxyAdmin= process.env.PROXY_ADMIN; //ropsten
    } else {
        proxyAdmin = accounts[1]; //dev
    }
    
    EdgeTokenProxy.deployed().then(proxy => {
        edgeTokenProxy = proxy;

        deployer.deploy(EdgeTokenV1).then((impl) => {
            edgeTokenImpl1 = impl;

            edgeTokenProxy.upgradeTo(edgeTokenImpl1.address, {from: proxyAdmin});
            
            /** if the new implemenations has init function - encode init function call first and then use upgradeToAndCall function instead of upgradeTo  */
            // const initializeDataV1 = encodeCall('initV1', ['bool', 'address', 'uint256'], [newBool, newAddr, newUint]);
            // edgeTokenProxy.upgradeToAndCall(edgeTokenImpl1.address, initializeDataV1, { from: proxyAdmin }))
        });
        
    });
};


```

Script should be run via truffle console:

```
migrate
```

without --reset flag, in order to run only last migration script

**Example for upgradability**
Inside of [./contract/edge/UpgradeExample/](./contract/edge/UpgradeExample/) there is a contract called [./EdgeTokenV1.sol](./contract/edge/UpgradeExample/EdgeTokenV1.sol) with correspending test [test/edge/EdgeTokenV1.test.js](.test/edge/EdgeTokenV1.test.js) for showing how an upgrade would occur on [./contract/edge/EdgeToken.sol]([./contract/edge/EdgeToken.sol) for internal education.  This code will not be used on production, and is merely an example for internal use.  Please do not use this for production!


## Validation of deployed smart contracts on etherscan
Effect of validation: You (and everyone else) will be able to see the code of the smart contract in etherscan

The following contracts can be validated:
* EdgeToken.sol
* EdgeTokenProxy.sol
* Operators.sol

1.  On etherscan ([https://ropsten.etherscan.io](https://ropsten.etherscan.io) if you have deployed on the Ropsten testnet) go to Misc > Verify Contract
2.  Define address of deployed contract (see logs of deployment process for address of contract)
3.  Define Compiler Type: single file
4.  Define Compiler Version. To find out the used compiler version check in the file `truffle-config.js` the value of `compilers.solc.version`.
5.  Click continue
6.  Put the smart contract code in the appropriate text area. Use the flatten smart contract code which is located in the project's flatten directory.