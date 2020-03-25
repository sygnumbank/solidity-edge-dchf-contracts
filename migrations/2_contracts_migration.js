const { BaseOperators } = require('@sygnum/solidity-base-contracts')

const EdgeToken = artifacts.require("EdgeToken")
const EdgeTokenProxy = artifacts.require("EdgeTokenProxy")
const encodeCall = require("zos-lib/lib/helpers/encodeCall");

module.exports = function( deployer ) {
   /* this.proxyAdmin= "0x0e5b1454a9b49d85F2De52D8C8027dF0EcDD5894"; 
    this.tokenAdmin = "0xD3C01261e6F3ca16AcA451202Ab1DA21C02A1F83"; 

    deployer.deploy(EdgeToken)
        .then((impl) => {
            console.log("EdgeToken", impl.address)
            this.edgeTokenImpl = impl;
            console.log(this.proxyAdmin)
            console.log(this.tokenAdmin)
            return deployer.deploy(BaseOperators, this.tokenAdmin);
        })
        .then((operInst) => {
            console.log("operatorsAddr", operInst.address)
			
			this.operatorsAddr = operInst.address
            
            console.log("deploying proxy")

            const initializeData = encodeCall.default('initialize', ['address'], [this.operatorsAddr])
            console.log("initializeData", initializeData);
            return deployer.deploy(EdgeTokenProxy, this.edgeTokenImpl.address, this.proxyAdmin, initializeData);
        }).then(function(proxy){
        	this.edgeTokenProxy = proxy;
        }).then(function(initDone) {
            console.log("Deployer edgeTokenProxy at ", this.edgeTokenProxy.address);
            console.log("Deployer edgeTokenImpl at ", this.edgeTokenImpl.address);	
        })*/
};