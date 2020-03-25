let EdgeTokenV1 = artifacts.require("./EdgeToken/EdgeTokenV1.sol");
let EdgeTokenProxy = artifacts.require("./EdgeToken/EdgeTokenProxy.sol");
// const encodeCall = require("../node_modules/zos-lib/lib/helpers/encodeCall");
// const {RANDOM_ADDRESS} = require('../test/helpers/common')

module.exports = function(deployer, network, accounts) {
    var edgeTokenProxy;
    var edgeTokenImpl1;
    var proxyAdmin;

    
    if( network == "ropsten" || network == "main") {
        proxyAdmin = process.env.PROXY_ADMIN; //ropsten
    } else {
        proxyAdmin = accounts[1]; //dev
    }
    
    EdgeTokenProxy.deployed().then(proxy => {
        edgeTokenProxy = proxy;

        deployer.deploy(EdgeTokenV1)
        .then((impl) => {
            edgeTokenImpl1 = impl;
            console.log("V1", edgeTokenImpl1.address);

            edgeTokenProxy.upgradeTo(edgeTokenImpl1.address, {from: proxyAdmin});
            
            /** if the new implemenations has init function - encode init function call first and then use upgradeToAndCall function instead of upgradeTo  */
            // const initializeDataV1 = encodeCall('initV1', ['bool', 'address', 'uint256'], [newBool, newAddr, newUint]);
            // edgeTokenProxy.upgradeToAndCall(edgeTokenImpl1.address, initializeDataV1, { from: proxyAdmin }))
        });
        
    });
};
