const contract = require("@truffle/contract");

const edgeTokenJson = require('./build/contracts/EdgeToken.json')
const EdgeToken = contract(edgeTokenJson)

const edgeTokenProxy = require('./build/contracts/EdgeTokenProxy.json')
const EdgeTokenProxy = contract(edgeTokenProxy)

EdgeToken.setProvider('http://localhost:8545')
EdgeTokenProxy.setProvider('http://localhost:8545')

module.exports = {
    EdgeToken,
    EdgeTokenProxy
}