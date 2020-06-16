const { expectRevert, EdgeTokenV1, newBool, newUint, ZERO_ADDRESS } = require('../../common')
const { BaseOperators, Whitelist } = require('@sygnum/solidity-base-contracts')


contract('EdgeTokenV1', ([admin, newAddress]) => {
    beforeEach(async () => {
        this.baseOperators = await BaseOperators.new(admin, {from: admin})
		this.whitelist = await Whitelist.new({ from: admin })
		this.token = await EdgeTokenV1.new({ from: admin })
	})
	context('when not initialized', () => {
		describe('new variables not initialized', () => {
			it('bool not initialized', async () => {
				assert.equal(await this.token.newBool(), false)
			});
			it('address not initialized', async () => {
				assert.equal(await this.token.newAddress(), ZERO_ADDRESS)
			});
			it('uint not initialized', async () => {
				assert.equal(await this.token.newUint(), 0)
			});
		});
		describe('initialize functional operation', () => {
			beforeEach(async () => {
				await this.token.initV1(newBool, newAddress, newUint)
			});
			it('bool initialized', async () => {
				assert.equal(await this.token.newBool(), newBool)
			});
			it('address initialized', async () => {
				assert.equal(await this.token.newAddress(), newAddress)
			});
			it('uint initialized', async () => {
				assert.equal(await this.token.newUint(), newUint)
			});
		});
	})
	context('when initialized', () => {
		beforeEach(async () => {
			await this.token.initialize(this.baseOperators.address, this.whitelist.address, newBool, newAddress, newUint)
		})
		it('initialization bool success', async () => {
			assert.equal(await this.token.initializedV1(), true)
		})
		describe('new variables initialized', () => {
			it('bool initialized', async () => {
				assert.equal(await this.token.newBool(), newBool)
			});
			it('address initialized', async () => {
				assert.equal(await this.token.newAddress(), newAddress)
			});
			it('uint initialized', async () => {
				assert.equal(await this.token.newUint(), newUint)
			});
		});
		describe('non-functional', () => {
			it('reverts when re-initializating', async () => {
					await expectRevert(this.token.initialize(this.baseOperators.address, this.whitelist.address, newBool, newAddress, newUint), 'Initializable: Contract instance has already been initialized')
			})
			it('reverts when calling re-initialization sub function', async () =>{
					await expectRevert(this.token.initV1(newBool, newAddress, newUint), 'EdgeTokenV1: already initialized')
			})
		});
	})
})