const { assertRevert, EdgeTokenV1, newBool, newUint } = require('../common')
const { BaseOperators } = require('@sygnum/solidity-base-contracts')


contract('EdgeTokenV1', function ([admin, operator, system, newAddress]) {
    beforeEach(async function () {
        this.baseOperators = await BaseOperators.new(admin, {from: admin})
        this.baseOperators.addOperator(operator, {from: admin})
        this.baseOperators.addSystem(system, {from: admin})
    })
	context('when not initialized', function () {
		beforeEach(async function () {
	        this.token = await EdgeTokenV1.new()
  			})
			it('can call re-initialization sub function', async function () {
		         await this.token.initV1(newBool, newAddress, newUint)				
		         it('variable initialization success', async function (){
			    	assert.equal(await this.token.newBool(), newBool)
			    	assert.equal(await this.token.newAddress(), newAddress)
			    	assert.equal(await this.token.newUint(), newUint)		         	
		         })
			})
			it('has not initialized', async function () {
		         assert.equal(await this.token.newBool(), false)
	        })
			context('when initialized', function () {
				 beforeEach(async function () {
	 		        await this.token.initialize(this.baseOperators.address, newBool, newAddress, newUint)
			     })
				it('initialization library success', async function () {
			        assert.equal(await this.token.initializedV1(), true)
			    })
			    it('initialization variable success', async function () {
			    	assert.equal(await this.token.newBool(), newBool)
			    	assert.equal(await this.token.newAddress(), newAddress)
			    	assert.equal(await this.token.newUint(), newUint)
			    })
			    it('reverts when re-initializating', async function () {
			         await assertRevert(this.token.initialize(this.baseOperators.address, newBool, newAddress, newUint))
			    })
			    it('reverts when calling re-initialization sub function', async function (){
			         await assertRevert(this.token.initV1(newBool, newAddress, newUint))
			    })
			})
	  })
})