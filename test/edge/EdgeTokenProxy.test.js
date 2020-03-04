const { getAdmin, getImplementation, encodeCall, expectEvent, expectRevert, assertRevert, EdgeToken, EdgeTokenV1, EdgeTokenProxy, newBool, newUint, ZERO_ADDRESS } = require('../common')
const { BaseOperators } = require('@sygnum/solidity-base-contracts')


contract('EdgeTokenProxy', function ([owner, admin, operator, proxyAdmin, proxyAdminNew, attacker, whitelisted, newAddress]) {
    beforeEach(async function () {
        this.baseOperators = await BaseOperators.new(admin, {from:admin})

        await this.baseOperators.addOperator(operator, {from:admin})
        assert.equal(await this.baseOperators.isOperator(operator), true, "operator not set");
        
        this.tokenImpl = await EdgeToken.new()
        this.tokenImplV1 = await EdgeTokenV1.new()
        const initializeData = encodeCall('initialize', ['address'], [this.baseOperators.address])
        this.proxy = await EdgeTokenProxy.new(this.tokenImpl.address, proxyAdmin, initializeData, {from: owner})
        this.token = await EdgeToken.at(this.proxy.address)
    })

    context('deployed proxy', function () {
        describe('has implementation set', function () {
            it('check implementation set', async function (){
                assert.equal(await getImplementation(this.proxy), this.tokenImpl.address.toLowerCase())
            })
        })
        context('admin set', function () {
            it('check admin set', async function () {
                assert.equal(await getAdmin(this.proxy), proxyAdmin.toLowerCase())
            })
            describe('non-functional', function () {
                it('admin transfer admin', async function () {
                    ({ logs: this.logs } = await this.proxy.changeAdmin(proxyAdminNew, { from: proxyAdmin }))
                    assert.equal(await getAdmin(this.proxy), proxyAdminNew.toLowerCase())                    
                })
                it('emits a AdminChanged event', function () {
                    expectEvent.inLogs(this.logs, 'AdminChanged', { previousAdmin:proxyAdmin , newAdmin: proxyAdminNew })
                })
            })            
            describe('functional', function () {
                it('admin transfer admin', async function () {
                    ({ logs: this.logs } = await this.proxy.changeAdmin(proxyAdminNew, { from: proxyAdmin }))
                    assert.equal(await getAdmin(this.proxy), proxyAdminNew.toLowerCase())                    
                })
                it('emits a AdminChanged event', function () {
                    expectEvent.inLogs(this.logs, 'AdminChanged', { previousAdmin:proxyAdmin , newAdmin: proxyAdminNew })
                })
            })            

            describe('change admin', function () {
                describe('from proxy admin', function () {
                    it('can transfer admin', async function () {
                        ({ logs: this.logs } = await this.proxy.changeAdmin(proxyAdminNew, { from: proxyAdmin }))
                        assert.equal(await getAdmin(this.proxy), proxyAdminNew.toLowerCase())
                    })
                    it('emits a AdminChanged event', function () {
                        expectEvent.inLogs(this.logs, 'AdminChanged', { previousAdmin:proxyAdmin , newAdmin: proxyAdminNew })
                    })
                    it('reverts when assigning empty address', async function () {
                        await expectRevert(this.proxy.changeAdmin(ZERO_ADDRESS, { from: proxyAdmin }), 'Cannot change the admin of a proxy to the zero address.')
                    })
                describe('from token admin', function () {
                    it('reverts', async function () {
                        await assertRevert(this.proxy.changeAdmin(proxyAdminNew, {from: admin}))
                    })
                })
                describe('from attacker', function () {
                    it('reverts', async function () {
                        await assertRevert(this.proxy.changeAdmin(proxyAdminNew, {from: attacker}))
                    })
                })
            })
          })
        })
        context('upgradability', function () {
          describe('upgrade to', function () {
            describe('from proxy admin', async function () {
                it('can upgrade to new implementation', async function () {
                    await this.proxy.upgradeTo(this.tokenImplV1.address, { from: proxyAdmin })
                    assert.equal(await getImplementation(this.proxy), this.tokenImplV1.address.toLowerCase())
                })
                it('HMM... reverts when same implementation', async function () {
                    /* TODO apparently you can...? OpenZeppelin...? */
                    await this.proxy.upgradeTo(this.tokenImplV1.address, { from: proxyAdmin })
                })
                it('reverts when implementation empty address', async function () {
                    await expectRevert(this.proxy.upgradeTo(ZERO_ADDRESS, { from: proxyAdmin }), 'Cannot set a proxy implementation to a non-contract address.')
                })          
            })
            describe('from attacker', function () {
                    it('reverts', async function () {
                        await assertRevert(this.proxy.upgradeTo(this.tokenImplV1.address, { from: attacker }))
                        assert.equal(await getImplementation(this.proxy), this.tokenImpl.address.toLowerCase())                    
                    })
                })
            })
          describe('upgrade and call', function () {
            beforeEach(function () {
               this.initializeDataV1 = encodeCall('initV1', ['bool', 'address', 'uint256'], [newBool, newAddress, newUint])
            })
            it('from proxy admin', async function () {
                await this.proxy.upgradeToAndCall(this.tokenImplV1.address, this.initializeDataV1, { from: proxyAdmin })
                assert.equal(await getImplementation(this.proxy), this.tokenImplV1.address.toLowerCase())
            })
            it('reverts from token admin', async function () {
                await assertRevert(this.proxy.upgradeToAndCall(this.tokenImplV1.address, this.initializeDataV1, { from: admin }))
                assert.equal(await getImplementation(this.proxy), this.tokenImpl.address.toLowerCase())
            })
            it('reverts when implementation empty address', async function () {
                await assertRevert(this.proxy.upgradeToAndCall(ZERO_ADDRESS, this.initializeDataV1, { from: admin }))
                assert.equal(await getImplementation(this.proxy), this.tokenImpl.address.toLowerCase())
            })
          })
      })
      context('delegate call initial implementation', function () {
        describe('mint initial', function () {
             beforeEach(async function () {
                 await this.token.toggleWhitelist(whitelisted, true, {from: operator})
                 assert.equal(await this.token.isWhitelisted(whitelisted), true)
                 this.mint = 100
             })
             it('reverts from proxy admin', async function () {
                 await expectRevert(this.token.mint(whitelisted, this.mint, { from: proxyAdmin }), 'Cannot call fallback function from the proxy admin.')
                 assert.equal(await this.token.balanceOf(whitelisted), 0)
             })
             it('reverts from attacker', async function () {
                 await expectRevert(this.token.mint(whitelisted, this.mint, { from: attacker }), 'Operatorable: caller does not have the operator role nor system')
                 assert.equal(await this.token.balanceOf(whitelisted), 0) 
             })
             describe('mint then upgrade ensure old data consistent', function () {
                     beforeEach(async function () {
                         await this.token.mint(whitelisted, this.mint, { from: operator })
                         
                         this.initializeDataV1 = encodeCall('initV1', ['bool', 'address', 'uint256'], [newBool, newAddress, newUint])
                         await this.proxy.upgradeToAndCall(this.tokenImplV1.address, this.initializeDataV1, {from: proxyAdmin})
                         assert.equal(await getImplementation(this.proxy), this.tokenImplV1.address.toLowerCase())
                         
                         this.token = await EdgeTokenV1.at(this.proxy.address)
                         assert.equal(this.token.address, this.proxy.address)                   
                     })
                     it('ensure old and new data validity', async function () {
                         assert.equal(await this.token.balanceOf(whitelisted), this.mint)
 
                         assert.equal(await this.token.newBool(), newBool)
                         assert.equal(await this.token.newAddress(), newAddress)
                         assert.equal(await this.token.newUint(), newUint)
                     })
                     it('ensure new logic validity', async function () {
                         await this.token.setNewAddress(owner)
                         assert.equal(await this.token.newAddress(), owner)
                     })
                 })
             })
         })
    })
})