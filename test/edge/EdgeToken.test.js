const { expectRevert, EdgeToken, ZERO_ADDRESS, TWO_ADDRESSES} = require('../common')
const { BaseOperators, THREE_HUNDRED_ADDRESS, THREE_HUNDRED_NUMBERS } = require('@sygnum/solidity-base-contracts')

contract('EdgeToken', function ([admin, operator, system, whitelisted, whitelisted1, whitelisted2, frozen, frozen1, notWhitelisted, attacker]){
    beforeEach(async function () {
        this.baseOperators = await BaseOperators.new(admin, { from: admin })
        this.token = await EdgeToken.new({ from: admin })
        this.token.initialize(this.baseOperators.address)
    })
    context('Role set-up', function () {
        beforeEach(async function () {
            await this.baseOperators.addOperator(operator, { from: admin })
            await this.baseOperators.addSystem(system, { from: admin })
        })
        describe('Whitelist set-up', function () {
            beforeEach(async function () {
				await this.token.batchToggleWhitelist([whitelisted, whitelisted1, whitelisted2, frozen, frozen1], true, { from: operator })
				await this.token.batchToggleFreeze([frozen, frozen1], true, { from: operator })				
            	this.mint = 100
            	this.burn = 50
            	this.overflow = this.mint + this.burn
            	this.transfer = 50
            })
     		context('mint', function () {
     			describe('non-batch', function (){
     				describe('unwhitelisted', function (){
		            	describe('non functional', function () {
		            		it('revert operator mint for unwhitelisted', async function () {
			                    await expectRevert(this.token.mint(notWhitelisted, this.mint, { from: operator }), 'Whitelist: account is not whitelisted')
		            		})
		            		it('revert system mint for unwhitelisted', async function () {
			                    await expectRevert(this.token.mint(notWhitelisted, this.mint, { from: system }), 'Whitelist: account is not whitelisted')
							})
	            		})
		            })
					describe('whitelisted', function (){
		            	describe('non functional', function () {
							it('revert self whitelist', async function () {
			                    await expectRevert(this.token.mint(whitelisted, this.mint, { from: whitelisted }), 'Operatorable: caller does not have the operator role nor system')							
							})
							it('revert mint 0', async function () { // @TODO should we implement 0 revert? 
			                    await expectRevert(this.token.mint(whitelisted, 0, { from: operator }), 'ERC20Mintable: amount has to be greater than 0')
							})						
							it('revert mint empty address', async function () {
			                    await expectRevert(this.token.mint(ZERO_ADDRESS, this.mint, { from: operator }), 'Whitelist: account is not whitelisted.') // Cannot add to whitelist before minting
							})						
							it('revert attacker mint', async function () {
			                    await expectRevert(this.token.mint(whitelisted, this.mint, { from: attacker }), 'Operatorable: caller does not have the operator role nor system.')
							})						
						})
						describe('functional', function () {
		            		it('operator mint for whitelisted', async function () {
			                    await this.token.mint(whitelisted, this.mint, { from: operator })
		            			assert.equal(await this.token.balanceOf(whitelisted), this.mint)
		            		})
		            		it('system mint for whitelisted', async function () {
			                    await this.token.mint(whitelisted, this.mint, { from: system })
		            			assert.equal(await this.token.balanceOf(whitelisted), this.mint)			                    
		            		})
		            		it('system/operator mint for multiple whitelisted', async function () {
			                    await this.token.mint(whitelisted, this.mint, { from: operator })
			                    await this.token.mint(whitelisted1, this.mint, { from: system })
		            			assert.equal(await this.token.balanceOf(whitelisted), this.mint)			                    		            			
		            			assert.equal(await this.token.balanceOf(whitelisted1), this.mint)			                    		            			
		            			assert.equal(await this.token.totalSupply(), (this.mint * 2))
		            		})		            		
            			})
						describe('frozen', function () {
			            	describe('functional', function () {
			            		it('operator mint for frozen', async function () {
				            		await this.token.mint(frozen, this.mint, { from: operator })
				            		assert.equal(await this.token.balanceOf(frozen), this.mint)			            			
			            		})
			            	})
			            	describe('nonfunctional', function () {
			            		it('revert system mint frozen', async function () {
				            		await expectRevert(this.token.mint(frozen, this.mint, { from: system }), 'EdgeToken: Account must be frozen if system calling.')
			            		})
			            	})
			            })
						describe('paused', function () {
		            		describe('nonfunctional', async function () {
			                    beforeEach(async function () {
									await this.token.pause({ from: operator })
									assert.equal(await this.token.isNotPaused(), false, "has not paused");
			                    })
		            			it('revert mint when paused', async function (){
			                        await expectRevert(this.token.mint(whitelisted, this.mint, { from: operator }), 'Pausable: paused')
			                        assert.equal(await this.token.balanceOf(whitelisted), 0)
			                        assert.equal(await this.token.totalSupply(), 0)
		            			})
		            		})
		            		describe('functional', async function () {
		            			beforeEach(async function () {
		            				await this.token.pause({ from:operator })
		            				await this.token.unpause({ from:operator })
		            			})
		            			it('unpause then mint', async function (){
			                        await this.token.mint(whitelisted, this.mint, { from: operator})
			                        assert.equal(await this.token.balanceOf(whitelisted), this.mint)
			                        assert.equal(await this.token.totalSupply(), this.mint)			                        		            				
		            			})
		            		})
		            	})
		            })
				}) // end of non-batch
     			describe('batch', function (){
					beforeEach(async function () {
						await this.token.batchToggleWhitelist(TWO_ADDRESSES, true, { from: operator })
					})							
     				describe('nonfunctional', function () {
     					it('revert address count and value count not equal', async function () {
     						await expectRevert(this.token.batchMint(TWO_ADDRESSES, [this.mint], { from: operator }), 'EdgeToken: values and recipients are not equal.')
     						assert.equal(await this.token.balanceOf(TWO_ADDRESSES[0]), 0)
     					})

     					it('revert mint to over 256 addresses', async function () {
     						await expectRevert(this.token.batchMint(THREE_HUNDRED_ADDRESS, THREE_HUNDRED_NUMBERS, { from: operator }), 'EdgeToken: greater than BATCH_LIMIT')
     						assert.equal(await this.token.balanceOf(THREE_HUNDRED_ADDRESS[0]), 0)
     					})
     				})
     				describe('functional', function () {
     					it('batch mint 2 addresses', async function () {
     						await this.token.batchMint(TWO_ADDRESSES, [this.mint, this.mint], { from: operator })
     						assert.equal(await this.token.balanceOf(TWO_ADDRESSES[0]), this.mint)         						
     						assert.equal(await this.token.balanceOf(TWO_ADDRESSES[1]), this.mint)         						
     					})
     				})
     			}) // end of batch

        	}) // End of mint
			context('burnable', function () {
				beforeEach(async function (){
					await this.token.batchMint([whitelisted, frozen], [this.mint, this.mint], { from: operator })
				})
				describe('burnFor', function () {
					describe('non-batch', function () {
						describe('whitelisted/unwhitelisted', function () {
							describe('nonfunctional', function () {
			            		it('revert unwhitelisted', async function () {
				                    await expectRevert(this.token.burnFor(notWhitelisted, this.burn, { from: operator }), 'Whitelist: account is not whitelisted')
			                        assert.equal(await this.token.balanceOf(whitelisted), this.mint)
			            		})
			            		it('revert from attacker', async function () {
				                    await expectRevert(this.token.burnFor(whitelisted, this.burn, { from: attacker }), 'Operatorable: caller does not have the operator role.')
									assert.equal(await this.token.balanceOf(whitelisted), this.mint)
			            		})
			            		it('revert for empty address', async function () {
				                    await expectRevert(this.token.burnFor(ZERO_ADDRESS, this.burn, { from: operator }), 'Whitelist: account is not whitelisted')
			                        assert.equal(await this.token.balanceOf(whitelisted), this.mint)
			            		})
			            		it('revert for over burn balance', async function () {
				                    await expectRevert(this.token.burnFor(whitelisted, this.overflow, { from: operator }), 'ERC20: burn amount exceeds balance.')
			                        assert.equal(await this.token.balanceOf(whitelisted), this.mint)
			            		})	
			            		it('revert system burnFor', async function () {
				                    await expectRevert(this.token.burnFor(whitelisted, this.burn, { from: system }), 'Operatorable: caller does not have the operator role.')
			                        assert.equal(await this.token.balanceOf(whitelisted), this.mint)
			            		})	
							})
							describe('functional', function () {
			            		it('operator burnFor whitelisted', async function () {
				                    await this.token.burnFor(whitelisted, this.burn, {from: operator })
			                        assert.equal(await this.token.balanceOf(whitelisted), this.burn)
			            		})
							})
						})
						describe('frozen', function () {
							describe('nonfunctional', function () {
			            		it('revert system burnFor frozen', async function () {
				                    await expectRevert(this.token.burnFor(frozen, this.burn, { from: system }), 'Operatorable: caller does not have the operator role.')
			                        assert.equal(await this.token.balanceOf(frozen), this.mint)
			            		})
			            	})
							describe('functional', function () {
			            		it('operator burnFor frozen', async function () {
				                    await this.token.burnFor(frozen, this.burn, { from: operator })
			                        assert.equal(await this.token.balanceOf(frozen), (this.mint - this.burn))
			            		})
			            	})
						})
						describe('paused', function () {
							beforeEach(async function () {
		                        await this.token.pause({from: operator})
							})
							describe('nonfunctional', function () {
			            		it('revert operator burnFor', async function () {
				                    await expectRevert(this.token.burnFor(frozen, this.burn, { from: operator }),'Pausable: paused.')
			                        assert.equal(await this.token.balanceOf(frozen), this.mint)
			            		})
							})
						})
					}) // end of non-batch
					describe('batch', function () {
							beforeEach(async function () {
								await this.token.batchToggleWhitelist(TWO_ADDRESSES, true, { from: operator })
		                        await this.token.batchMint(TWO_ADDRESSES, [this.mint, this.mint], { from: operator })
							})							
						describe('nonfunctional', function () {
         					it('address count and value count not equal', async function () {
         						await expectRevert(this.token.batchBurnFor(TWO_ADDRESSES, [this.burn], { from: operator }), 'EdgeToken: values and recipients are not equal.')
         						assert.equal(await this.token.balanceOf(TWO_ADDRESSES[0]), this.mint)
         					})
         					it('burnFor over 256 addresses', async function () {
         						await expectRevert(this.token.batchBurnFor(THREE_HUNDRED_ADDRESS, THREE_HUNDRED_NUMBERS, { from: operator }), 'EdgeToken: batch count is greater than BATCH_LIMIT')
         						assert.equal(await this.token.balanceOf(THREE_HUNDRED_ADDRESS[0]), 0)
         					})
         				})
         				describe('functional', function () {
         					it('batch burnFor 2 addresses', async function () {
         						await this.token.batchBurnFor(TWO_ADDRESSES, [this.burn, this.burn], { from: operator })
         						assert.equal(await this.token.balanceOf(TWO_ADDRESSES[0]), (this.mint - this.burn))         						
         						assert.equal(await this.token.balanceOf(TWO_ADDRESSES[1]), (this.mint - this.burn))         						
         					})
         				})
					}) // end of batch		
				}) // End of burnFor
				describe('burn', function () {
					describe('nonfunctional', function () {
	            		it('revert for over burn balance', async function () {
		                    await expectRevert(this.token.burn(this.overflow, { from: whitelisted }), 'ERC20: burn amount exceeds balance.')
	                        assert.equal(await this.token.balanceOf(whitelisted), this.mint)
	            		})	
	            		it('revert for notWhitelisted', async function () {
		                    await expectRevert(this.token.burn(this.burn, { from: notWhitelisted }), 'Whitelist: account is not whitelisted')
	                        assert.equal(await this.token.balanceOf(notWhitelisted), 0)
	            		})	
	            		it('revert for frozen whitelisted ', async function () {
		                    await expectRevert(this.token.burn(this.burn, { from: frozen }), 'EdgeToken: Account must not be frozen')
	                        assert.equal(await this.token.balanceOf(frozen), this.mint)
						})
						describe('paused', function () {
	            			beforeEach(async function () {
		                        await this.token.pause({from: operator})
							})
		            		it('revert when paused', async function () {
			                    await expectRevert(this.token.burn(this.burn, { from: whitelisted }), 'Pausable: paused')
		                        assert.equal(await this.token.balanceOf(whitelisted), this.mint)
		            		})
	            		})
	            		describe('functional', function () {
							it('burn from whitelisted', async function (){
								await this.token.burn(this.burn, { from: whitelisted })
								assert.equal(await this.token.balanceOf(whitelisted), (this.mint - this.burn), "amount has not been burnt");
							})
						})
					})
				}) // End of burn
			})  // End of burnable
			context('confiscate', function () {
				beforeEach(async function (){
					await this.token.batchMint([ whitelisted, whitelisted1, frozen, frozen1 ], [ this.mint, this.mint, this.mint, this.mint], { from: operator})
					this.confiscate = 50
				})
				describe('unwhitelisted', async function (){
					describe('non-batch', async function (){
						describe('nonfunctional', async function (){
							it('revert confiscate from nonwhitelisted address to whitelisted', async function () {
								await expectRevert(this.token.confiscate(notWhitelisted, whitelisted, this.confiscate, { from: operator }), 'Whitelist: account is not whitelisted')
							});
							it('revert confiscate from whitelisted address to nonwhitelisted', async function () {
								await expectRevert(this.token.confiscate(whitelisted, notWhitelisted, this.confiscate, { from: operator }), 'Whitelist: account is not whitelisted')
							});
							it('revert confiscate from non-operator', async function () {
								await expectRevert(this.token.confiscate(whitelisted, whitelisted2, this.confiscate, { from: admin }), 'Operatorable: caller does not have the operator role')
							});		
							it('revert confiscate not enough balance', async function () {
								await expectRevert(this.token.confiscate(whitelisted2, whitelisted, this.confiscate, { from: operator }), 'ERC20: transfer amount exceeds balance.')
							});		
							describe('when paused', async function (){0
								beforeEach(async function (){
									await this.token.pause({ from:operator })
								});
								it('revert confiscate when paused', async function () {
									await expectRevert(this.token.confiscate(whitelisted, whitelisted2, this.confiscate, { from: operator }), 'Pausable: paused')
								});										
							});
						});
						describe('functional', async function () {
							it('confiscate', async function () {
								await this.token.confiscate(whitelisted, whitelisted2, this.confiscate, { from: operator })
								assert.equal(await this.token.balanceOf(whitelisted2), this.confiscate)
							});							
						});							
					});
					describe('non-batch', async function (){
						describe('nonfunctional', async function (){
							it('revert confiscatees and values not equal', async function () {
								await expectRevert(this.token.batchConfiscate(TWO_ADDRESSES, TWO_ADDRESSES, [this.mint], { from: operator }), 'EdgeToken: values and recipients are not equal')
							})
							it('revert receivers and values not equal', async function () {
								await expectRevert(this.token.batchConfiscate(TWO_ADDRESSES, [TWO_ADDRESSES[0]], [this.mint, this.mint], { from: operator }), 'EdgeToken: values and recipients are not equal')
							})
							it('revert confiscate to over 256 addresses', async function () {
								await expectRevert(this.token.batchConfiscate(THREE_HUNDRED_ADDRESS, THREE_HUNDRED_ADDRESS, THREE_HUNDRED_NUMBERS, { from: operator }), 'EdgeToken: batch count is greater than BATCH_LIMIT')
							})
						})
						describe('functional', function (){
							beforeEach(async function () {
								await this.token.batchToggleWhitelist(TWO_ADDRESSES, true, {from: operator})
							});
							it('confiscate batch 2 addresses', async function () {
								await this.token.batchConfiscate([ whitelisted, whitelisted1 ], TWO_ADDRESSES, [this.burn, this.burn], { from: operator })
         						assert.equal(await this.token.balanceOf(whitelisted), (this.mint - this.burn))         						
         						assert.equal(await this.token.balanceOf(whitelisted1), (this.mint - this.burn))   
							});
						})
					})
				});
			})
			context('transfer', function () {
				beforeEach(async function (){
					await this.token.batchMint([ whitelisted, whitelisted1, frozen, frozen1 ], [ this.mint, this.mint, this.mint, this.mint], { from: operator})
				})
				describe('unwhitelisted', async function () {
					describe('nonfunctional', async function () {						
						it('revert whitelisted transfer to notWhitelisted', async function (){
							await expectRevert(this.token.transfer(notWhitelisted, this.transfer, { from: whitelisted }), 'Whitelist: account is not whitelisted')
							assert.equal(await this.token.balanceOf(whitelisted), this.mint)
							assert.equal(await this.token.balanceOf(notWhitelisted), 0)
						})
					})
				})
				describe('whitelisted', async function () {
					describe('nonfunctional', async function () {						
						it('revert transfer to empty address', async function (){
		                    await expectRevert(this.token.transfer(ZERO_ADDRESS, this.transfer, { from: whitelisted }), 'Whitelist: account is not whitelisted')
							assert.equal(await this.token.balanceOf(whitelisted), this.mint)						
						})
						it('revert transfer more than balance', async function (){
		                    await expectRevert(this.token.transfer(whitelisted1, (this.mint + this.transfer), { from: whitelisted }), 'ERC20: transfer amount exceeds balance.')
							assert.equal(await this.token.balanceOf(whitelisted), this.mint)						
						})
					})
					describe('functional', async function () {						
						it('whitelist transfer to whitelist', async function (){
		                    await this.token.transfer(whitelisted1, this.transfer, { from: whitelisted })
							assert.equal(await this.token.balanceOf(whitelisted), (this.mint - this.transfer))
							assert.equal(await this.token.balanceOf(whitelisted1), (this.mint + this.transfer))
						})
			
						it('whitelist transfer to whitelist and back', async function (){
		                    await this.token.transfer(whitelisted1, this.transfer, { from: whitelisted })
							assert.equal(await this.token.balanceOf(whitelisted), (this.mint - this.transfer))
							assert.equal(await this.token.balanceOf(whitelisted1), (this.mint + this.transfer))
		                    await this.token.transfer(whitelisted, this.transfer, {from: whitelisted1})						
							assert.equal(await this.token.balanceOf(whitelisted), this.mint)
							assert.equal(await this.token.balanceOf(whitelisted1), this.mint)
						})
					})
				})
				describe('frozen', async function () {
					describe('nonfunctional', function () {
						it('revert whitelist transfer to frozen', async function (){
		                    await expectRevert(this.token.transfer(frozen, this.transfer, { from: whitelisted }), 'Freezable: account is frozen')
	                        assert.equal(await this.token.balanceOf(whitelisted), this.mint)
						})
						it('revert frozen transfer to whitelisted', async function (){
							await expectRevert(this.token.transfer(whitelisted, this.transfer, { from: frozen }), 'Freezable: account is frozen')
	                        assert.equal(await this.token.balanceOf(whitelisted), this.mint)
						})
						it('revert frozen transfer to frozen', async function (){
							await expectRevert(this.token.transfer(frozen1, this.transfer, { from: frozen }), 'Freezable: account is frozen')
	                        assert.equal(await this.token.balanceOf(whitelisted), this.mint)
						})
					})
				})
				describe('pause', async function () {
					beforeEach(async function () {
                        await this.token.pause({from: operator})
					})
	        		it('revert any transfer', async function () {
	                    await expectRevert(this.token.transfer(whitelisted1, this.transfer, { from: whitelisted }), 'Pausable: paused')
                        assert.equal(await this.token.balanceOf(whitelisted), this.mint)
                        assert.equal(await this.token.balanceOf(whitelisted1), this.mint)
		        	})
				})
			})  // End of transfer
			context('approval/allowances/transferFrom/burnFrom', function () {
				beforeEach(async function (){
					await this.token.batchMint([ whitelisted, frozen, frozen1 ], [ this.mint, this.mint, this.mint ], { from: operator })
                    this.approve = 50					
				})
				describe('approval', async function () {
					beforeEach(function() {
                       this.approvalModification = 25
					 })
					describe('nonfunctional', function () {
						describe('non-whitelisted', async function () {
							it('revert notWhitelisted approval to whitelisted', async function (){
								await expectRevert(this.token.approve(whitelisted, this.approve, { from: notWhitelisted }), 'Whitelist: account is not whitelisted')
								assert.equal(await this.token.allowance(notWhitelisted, whitelisted), 0)								
							})
							it('revert whitelisted approval to notWhitelisted', async function (){
								await expectRevert(this.token.approve(notWhitelisted, this.approve, { from: whitelisted }), 'Whitelist: account is not whitelisted')
								assert.equal(await this.token.allowance(whitelisted, notWhitelisted), 0)
							})		
							it('revert whitelisted approval to notWhitelisted', async function (){
								await expectRevert(this.token.approve(notWhitelisted, this.approve, { from: whitelisted }), 'Whitelist: account is not whitelisted')
								assert.equal(await this.token.allowance(whitelisted, notWhitelisted), 0)
							})
						});
						describe('frozen', async function () {
							it('revert whitelisted approve frozen', async function (){
	                        	await expectRevert(this.token.approve(frozen, this.approve, { from: whitelisted }), 'Freezable: account is frozen')	
		                        assert.equal(await this.token.allowance(whitelisted, frozen), 0)
							})
							it('revert frozen approve whitelisted', async function (){
	                        	await expectRevert(this.token.approve(whitelisted, this.approve, { from: frozen }), 'Freezable: account is frozen')
		                        assert.equal(await this.token.allowance(frozen, whitelisted), 0)
							})
							it('revert frozen approve frozen', async function (){
	                        	await expectRevert(this.token.approve(frozen1, this.approve, { from: frozen }), 'Freezable: account is frozen')	
		                        assert.equal(await this.token.allowance(frozen, frozen1), 0)
							})
						})
						it('revert empty address spender', async function () {
							await expectRevert(this.token.approve(ZERO_ADDRESS, this.approve, {from: whitelisted}), 'Whitelist: account is not whitelisted')								
						});									
						describe('paused approval', function () {
							beforeEach(async function () {
								await this.token.pause({ from: operator })
							});
							it('revert approve when paused', async function () {
								await expectRevert(this.token.approve(whitelisted2, this.approve, { from: whitelisted }), 'Pausable: paused')	
							});
						});
					})
					describe('functional', function () {
						it('whitelist to whitelist', async function (){
							await this.token.approve(whitelisted, this.approve, {from: whitelisted1})
	                        assert.equal(await this.token.allowance(whitelisted1, whitelisted), this.approve)
						})
					})
					describe('increaseAllowance', () => {
						beforeEach(async function (){
							await this.token.approve(whitelisted, this.approve, {from: whitelisted1})
						});	
						describe('nonfunctional', function () {
							describe('non-whitelisted', async function () {
								it('revert notWhitelisted increase allowance to whitelisted', async function (){
									await expectRevert(this.token.increaseAllowance(whitelisted, this.approve, { from: notWhitelisted }), 'Whitelist: account is not whitelisted')
									assert.equal(await this.token.allowance(notWhitelisted, whitelisted), 0)								
								})
								it('revert whitelisted increase allowance to notWhitelisted', async function (){
									await expectRevert(this.token.increaseAllowance(notWhitelisted, this.approve, { from: whitelisted }), 'Whitelist: account is not whitelisted')
									assert.equal(await this.token.allowance(whitelisted, notWhitelisted), 0)
								})
							});
							describe('frozen', async function () {
								it('revert whitelist increase frozen', async function () {
									await expectRevert(this.token.increaseAllowance(frozen, this.approvalModification, { from: whitelisted }), 'Freezable: account is frozen')
									assert.equal(await this.token.allowance(whitelisted, frozen), 0)
								})
								it('revert frozen increase whitelisted', async function () {
									await expectRevert(this.token.increaseAllowance(whitelisted, this.approvalModification, { from: frozen }), 'Freezable: account is frozen')
									assert.equal(await this.token.allowance(frozen, whitelisted), 0)
								})
								it('revert frozen increase frozen', async function () {
									await expectRevert(this.token.increaseAllowance(frozen1, this.approvalModification, { from: frozen }), 'Freezable: account is frozen')
									assert.equal(await this.token.allowance(frozen, frozen1), 0)
								})
							})
							it('revert empty address', async function () {
								await expectRevert(this.token.increaseAllowance(ZERO_ADDRESS, this.approvalModification, { from: whitelisted1 }), 'Whitelist: account is not whitelisted')								
							});	
							describe('paused increaseAllowance', function () {
								beforeEach(async function () {
									await this.token.pause({ from: operator })
								});
								it('revert increaseAllowance when paused', async function () {
									await expectRevert(this.token.increaseAllowance(whitelisted, this.approvalModification, { from: whitelisted1 }), 'Pausable: paused')	
								});
							});
						})
						describe('functional', function (){
							it('increase allowance', async function (){
								await this.token.increaseAllowance(whitelisted, this.approvalModification, { from: whitelisted1 })
		                        assert.equal(await this.token.allowance(whitelisted1, whitelisted), (this.approve + this.approvalModification))
							});
						});
					}); // end of increaseAllowance
					describe('decreaseAllowance', () => {
						beforeEach(async function (){
							await this.token.approve(whitelisted, this.approve, {from: whitelisted1})
						});	
						describe('nonfunctional', function () {
							describe('non-whitelisted', async function () {
								it('revert notWhitelisted decrease allowance to whitelisted', async function (){
									await expectRevert(this.token.decreaseAllowance(whitelisted, this.approve, { from: notWhitelisted }), 'Whitelist: account is not whitelisted')
									assert.equal(await this.token.allowance(notWhitelisted, whitelisted), 0)								
								})
								it('revert whitelisted decrease allowance to notWhitelisted', async function (){
									await expectRevert(this.token.decreaseAllowance(notWhitelisted, this.approve, { from: whitelisted }), 'Whitelist: account is not whitelisted')
									assert.equal(await this.token.allowance(whitelisted, notWhitelisted), 0)
								})
							});
							describe('frozen', async function () {
								it('revert whitelist decrease frozen', async function () {
									await expectRevert(this.token.decreaseAllowance(frozen, this.approvalModification, { from: whitelisted }), 'Freezable: account is frozen')
									assert.equal(await this.token.allowance(whitelisted, frozen), 0)
								})
								it('revert frozen decrease whitelisted', async function () {
									await expectRevert(this.token.decreaseAllowance(whitelisted, this.approvalModification, { from: frozen }), 'Freezable: account is frozen')
									assert.equal(await this.token.allowance(frozen, whitelisted), 0)
								})
								it('revert frozen decrease frozen', async function () {
									await expectRevert(this.token.decreaseAllowance(frozen1, this.approvalModification, { from: frozen }), 'Freezable: account is frozen')
									assert.equal(await this.token.allowance(frozen, frozen1), 0)
								})
							})
							it('revert empty address', async function () {
								await expectRevert(this.token.decreaseAllowance(ZERO_ADDRESS, this.approvalModification, { from: whitelisted1 }), 'Whitelist: account is not whitelisted')								
							});	
							it('revert overflow transferFrom', async function () {
								await expectRevert(this.token.transferFrom(whitelisted1, whitelisted2, this.overflow, { from: whitelisted }), 'ERC20: transfer amount exceeds balance.')								
							});
							describe('paused decreaseAllowance', function () {
								beforeEach(async function () {
									await this.token.pause({ from: operator })
								});
								it('revert decreaseAllowance when paused', async function () {
									await expectRevert(this.token.decreaseAllowance(whitelisted1, this.approvalModification, { from: whitelisted }), 'Pausable: paused')	
								});
							});
						})
						describe('functional', function (){
							it('decrease allowance', async function (){
		                        await this.token.decreaseAllowance(whitelisted, this.approvalModification, { from: whitelisted1 })
		                        assert.equal(await this.token.allowance(whitelisted1, whitelisted), (this.approve - this.approvalModification))
							});
						});
					});// end of decreaseAllowance
					beforeEach(async function (){
						await this.token.mint(whitelisted1, this.mint, { from: operator })
						await this.token.approve(whitelisted, this.approve, {from: whitelisted1})
                        assert.equal(await this.token.allowance(whitelisted1, whitelisted), this.approve)
					})
	                describe('transferFrom', function () {
						describe('nonfunctional', function () {
							describe('frozen', async function () {
								it('revert whitelisted transferFrom to frozen', async function () {
									await expectRevert(this.token.transferFrom(whitelisted1, frozen, this.approve, { from: whitelisted }), 'Freezable: account is frozen')
									assert.equal(await this.token.balanceOf(frozen), this.mint)		                			                		
								})
								it('revert frozen transferFrom to whitelisted', async function () {
									await this.token.toggleFreeze(whitelisted, true, { from: operator })
									await expectRevert(this.token.transferFrom(whitelisted1, whitelisted2, this.approve, { from: whitelisted }), 'Freezable: account is frozen')
									assert.equal(await this.token.balanceOf(whitelisted2), 0)		                			                		
								})									
							});
							describe('non whitelisted', async function () {
								it('revert nonwhitelisted transferFrom to whitelisted', async function () {
									await expectRevert(this.token.transferFrom(notWhitelisted, whitelisted2, this.approve, { from: whitelisted }), 'Whitelist: account is not whitelisted')
								})
								it('revert nonwhitelisted transferFrom to whitelisted', async function () {
									await expectRevert(this.token.transferFrom(whitelisted1, whitelisted, this.approve, { from: notWhitelisted }), 'Whitelist: account is not whitelisted')
								})
								it('revert nonwhitelisted transferFrom to whitelisted', async function () {
									await expectRevert(this.token.transferFrom(whitelisted, whitelisted1, this.approve, { from: notWhitelisted }), 'Whitelist: account is not whitelisted')
								})
							});
							describe('empty', async function (){
								it('revert empty address sender', async function () {
									await expectRevert(this.token.transferFrom(ZERO_ADDRESS, whitelisted2, this.approve, { from: whitelisted }), 'Whitelist: account is not whitelisted')								
								});	
								it('revert empty address recipient', async function () {
									await expectRevert(this.token.transferFrom(whitelisted1, ZERO_ADDRESS, this.approve, { from: whitelisted }), 'Whitelist: account is not whitelisted')								
								});	
							});
							it('revert overflow transferFrom', async function () {
								await expectRevert(this.token.transferFrom(whitelisted1, whitelisted2, this.overflow, { from: whitelisted }), 'ERC20: transfer amount exceeds balance.')								
							});
							describe('paused transferFrom', async function () {
								beforeEach(async function () {
									await this.token.pause({ from: operator })
								});
								it('revert all when paused', async function () {
									await expectRevert(this.token.transferFrom(whitelisted1, whitelisted2, this.approve, { from: whitelisted }), 'Pausable: paused')
								});
							});
						})	
						describe('functional', function () {
		                	it('whitelisted transferFrom to whitelisted', async function () {
			                	await this.token.transferFrom(whitelisted1, whitelisted2, this.approve, { from: whitelisted })
		                        assert.equal(await this.token.balanceOf(whitelisted2), (this.approve))		                			                		
		                	})								
						})
	                })// end of transferFrom
	                describe('burnFrom', function () {
						describe('nonfunctional', function () {
							it('revert nonwhitelisted burnFrom to whitelisted', async function () {
			                	await expectRevert(this.token.burnFrom(whitelisted, this.burn, { from: notWhitelisted }), 'Whitelist: account is not whitelisted')
		                	})
							it('revert whitelisted burnFrom to frozen', async function () {
			                	await expectRevert(this.token.burnFrom(frozen, this.burn, { from: whitelisted }), 'Freezable: account is frozen')
		                	})
		                	it('revert frozen transferFrom to whitelisted', async function () {
			                	await expectRevert(this.token.burnFrom(whitelisted, this.approve, { from: frozen }), 'Freezable: account is frozen')
							})
							it('revert overflow burnFrom', async function () {
			                	await expectRevert(this.token.burnFrom(whitelisted1, this.overflow, { from: whitelisted }), 'ERC20: burn amount exceeds balance')								
							});
							it('revert empty address ', async function () {
			                	await expectRevert(this.token.burnFrom(ZERO_ADDRESS, this.overflow, { from: whitelisted }), 'Whitelist: account is not whitelisted')								
							});
							describe('paused burnFrom', async function () {
								beforeEach(async function () {
									await this.token.pause({ from: operator })
								});
								it('revert all when paused', async function () {
									await expectRevert(this.token.burnFrom(whitelisted1, this.burn, { from: whitelisted }), 'Pausable: paused')
								});
							});
						})
						describe('functional', function () {
		                	it('whitelisted burnFrom to whitelisted', async function () {
		                		await this.token.burnFrom(whitelisted1, this.burn, { from: whitelisted })
		                        assert.equal(await this.token.allowance(whitelisted1, whitelisted), 0)
		                        assert.equal(await this.token.balanceOf(whitelisted1), (this.mint - this.burn))
		                	})
						})
					})// end of burnFrom

				}) // end of approval

			}) // approval/allowances/transferFrom
        })
    })
})