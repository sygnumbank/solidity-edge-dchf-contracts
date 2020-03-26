const { getAdmin, getImplementation, encodeCall, expectEvent, expectRevert, assertRevert, EdgeToken, EdgeTokenConstructorUpgrade, EdgeTokenProxy, ZERO_ADDRESS } = require('../common')
const { BaseOperators } = require('@sygnum/solidity-base-contracts')


contract('EdgeTokenProxy', function ([owner, admin, operator, proxyAdmin, proxyAdminNew, attacker, whitelisted, newAddress]) {
    beforeEach(async function () {
        this.baseOperators = await BaseOperators.new(admin, {from:admin})

        await this.baseOperators.addOperator(operator, {from:admin})
        assert.equal(await this.baseOperators.isOperator(operator), true, "operator not set");
        
        this.tokenImpl = await EdgeToken.new()
        this.tokenImplUpgrade = await EdgeTokenConstructorUpgrade.new()
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
                    await this.proxy.upgradeTo(this.tokenImplUpgrade.address, { from: proxyAdmin })
                    assert.equal(await getImplementation(this.proxy), this.tokenImplUpgrade.address.toLowerCase())
                })
                it('reverts when implementation empty address', async function () {
                    await expectRevert(this.proxy.upgradeTo(ZERO_ADDRESS, { from: proxyAdmin }), 'Cannot set a proxy implementation to a non-contract address.')
                })          
            })
          describe('upgrade and call', function () {
            beforeEach(function () {
               this.initializeDataV1 = encodeCall('initializeConstructor')
            })
            it('from proxy admin', async function () {
                await this.proxy.upgradeToAndCall(this.tokenImplUpgrade.address, this.initializeDataV1, { from: proxyAdmin })
                assert.equal(await getImplementation(this.proxy), this.tokenImplUpgrade.address.toLowerCase())
            })
            it('reverts from token admin', async function () {
                await assertRevert(this.proxy.upgradeToAndCall(this.tokenImplUpgrade.address, this.initializeDataV1, { from: admin }))
                assert.equal(await getImplementation(this.proxy), this.tokenImpl.address.toLowerCase())
            })
            it('reverts when implementation empty address', async function () {
                await assertRevert(this.proxy.upgradeToAndCall(ZERO_ADDRESS, this.initializeDataV1, { from: admin }))
                assert.equal(await getImplementation(this.proxy), this.tokenImpl.address.toLowerCase())
            })
          })
        })
      })
      context('upgrade and call', function () {
        describe('constructor values initialized', function () {
            beforeEach(async function () {
                this.initializeDataV1 = encodeCall('initializeConstructor')
                await this.proxy.upgradeToAndCall(this.tokenImplUpgrade.address, this.initializeDataV1, {from: proxyAdmin})
                this.token = await EdgeTokenConstructorUpgrade.at(this.proxy.address)
                assert.equal(this.token.address, this.proxy.address)         
            })
            it('name updated', async function () {
                assert.equal(await this.token.name(), "Digital CHF")
            })
            it('symbol updated', async function () {
                assert.equal(await this.token.symbol(), "DCHF")
            })
            it('decimals updated', async function () {
                assert.equal(await this.token.decimals(), 2)
            })
            describe('constructor values initialized', function () {
                beforeEach(async function () {
                    await this.token.toggleWhitelist(whitelisted, true, { from: operator })
                    await this.token.mint(whitelisted, 100, { from: operator })
                });
                it('ensure mint balance updated', async function () {
                    assert.equal(await this.token.balanceOf(whitelisted), 100)
                });
                describe('old versions', function () {
                    beforeEach(async function () {
                        this.token = await EdgeToken.at(this.proxy.address)
                        await this.token.mint(whitelisted, 100, { from: operator })                            
                    });
                    it('old version works', async function () {
                        assert.equal(await this.token.balanceOf(whitelisted), 200)
                    });
                    describe('then switch to new versions', function () {
                        beforeEach(async function () {
                            this.token = await EdgeTokenConstructorUpgrade.at(this.proxy.address)
                            await this.token.mint(whitelisted, 100, { from: operator })                            
                        });
                        it('new version works', async function () {
                            assert.equal(await this.token.balanceOf(whitelisted), 300)
                        });
                });
            })
            })
         })
        })
    })
})