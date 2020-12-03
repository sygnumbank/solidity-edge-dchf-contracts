const { BaseOperators, Whitelist, THREE_HUNDRED_ADDRESS, THREE_HUNDRED_NUMBERS, MINT, BURN, TRANSFER } = require("@sygnum/solidity-base-contracts");

const { expectRevert, EdgeToken, ZERO_ADDRESS, TWO_ADDRESSES } = require("../common");

contract("EdgeToken", ([admin, operator, system, whitelisted, whitelisted1, whitelisted2, frozen, frozen1, notWhitelisted, attacker]) => {
  beforeEach(async () => {
    this.baseOperators = await BaseOperators.new(admin, { from: admin });
    this.token = await EdgeToken.new({ from: admin });
    this.whitelist = await Whitelist.new({ from: admin });

    await this.whitelist.initialize(this.baseOperators.address, { from: admin });
    await this.token.methods["initialize(address,address)"](this.baseOperators.address, this.whitelist.address, { from: admin });
  });
  describe("token initialized", () => {
    it("base operators", async () => {
      assert.equal(await this.token.getOperatorsContract(), this.baseOperators.address);
    });
    it("whitelist", async () => {
      assert.equal(await this.token.getWhitelistContract(), this.whitelist.address);
    });
  });
  context("Role set-up", () => {
    beforeEach(async () => {
      await this.baseOperators.addOperator(operator, { from: admin });
      await this.baseOperators.addSystem(system, { from: admin });
    });
    describe("Whitelist set-up", () => {
      beforeEach(async () => {
        await this.whitelist.batchToggleWhitelist([whitelisted, whitelisted1, whitelisted2, frozen, frozen1], true, { from: operator });
        await this.token.batchToggleFreeze([frozen, frozen1], true, { from: operator });
        this.overflow = MINT + BURN;
      });
      context("mint", () => {
        describe("non-batch", () => {
          describe("unwhitelisted", () => {
            describe("non functional", () => {
              it("revert operator mint for unwhitelisted", async () => {
                await expectRevert(this.token.mint(notWhitelisted, MINT, { from: operator }), "Whitelistable: account is not whitelisted");
              });
              it("revert system mint for unwhitelisted", async () => {
                await expectRevert(this.token.mint(notWhitelisted, MINT, { from: system }), "Whitelistable: account is not whitelisted");
              });
            });
          });
          describe("whitelisted", () => {
            describe("non functional", () => {
              it("revert self whitelist", async () => {
                await expectRevert(
                  this.token.mint(whitelisted, MINT, { from: whitelisted }),
                  "Operatorable: caller does not have the operator role nor system"
                );
              });
              it("revert mint 0", async () => {
                await expectRevert(this.token.mint(whitelisted, 0, { from: operator }), "ERC20Mintable: amount has to be greater than 0");
              });
              it("revert mint empty address", async () => {
                await expectRevert(this.token.mint(ZERO_ADDRESS, MINT, { from: operator }), "Whitelistable: account is not whitelisted."); // Cannot add to whitelist before minting
              });
              it("revert attacker mint", async () => {
                await expectRevert(this.token.mint(whitelisted, MINT, { from: attacker }), "Operatorable: caller does not have the operator role nor system.");
              });
            });
            describe("functional", () => {
              describe("from operator", () => {
                beforeEach(async () => {
                  await this.token.mint(whitelisted, MINT, { from: operator });
                });
                it("balance updated", async () => {
                  assert.equal(await this.token.balanceOf(whitelisted), MINT);
                });
                it("total supply updated", async () => {
                  assert.equal(await this.token.totalSupply(), MINT);
                });
              });
              describe("from system", () => {
                beforeEach(async () => {
                  await this.token.mint(whitelisted, MINT, { from: system });
                });
                it("balance updated", async () => {
                  assert.equal(await this.token.balanceOf(whitelisted), MINT);
                });
                it("total supply updated", async () => {
                  assert.equal(await this.token.totalSupply(), MINT);
                });
              });
            });
            describe("frozen", () => {
              describe("functional", () => {
                describe("from operator", () => {
                  beforeEach(async () => {
                    await this.token.mint(frozen, MINT, { from: operator });
                  });
                  it("balance updated", async () => {
                    assert.equal(await this.token.balanceOf(frozen), MINT);
                  });
                  it("total supply updated", async () => {
                    assert.equal(await this.token.totalSupply(), MINT);
                  });
                });
              });
              describe("non-functional", () => {
                it("revert system mint frozen", async () => {
                  await expectRevert(this.token.mint(frozen, MINT, { from: system }), "EdgeToken: Account must be frozen if system calling.");
                });
              });
            });
            describe("paused", () => {
              beforeEach(async () => {
                await this.token.pause({ from: operator });
              });
              describe("non-functional", async () => {
                it("revert minting", async () => {
                  await expectRevert(this.token.mint(whitelisted, MINT, { from: operator }), "Pausable: paused");
                });
              });
              describe("functional", async () => {
                describe("unpaused then mint", () => {
                  beforeEach(async () => {
                    await this.token.unpause({ from: operator });
                  });
                  describe("can mint again", () => {
                    beforeEach(async () => {
                      await this.token.mint(whitelisted, MINT, { from: operator });
                    });
                    it("balance updated", async () => {
                      assert.equal(await this.token.balanceOf(whitelisted), MINT);
                    });
                    it("total supply updated", async () => {
                      assert.equal(await this.token.totalSupply(), MINT);
                    });
                  });
                });
              });
            });
          });
        }); // end of non-batch
        describe("batch", () => {
          beforeEach(async () => {
            await this.whitelist.batchToggleWhitelist(TWO_ADDRESSES, true, { from: operator });
          });
          describe("non-functional", () => {
            it("revert address count and value count not equal", async () => {
              await expectRevert(this.token.batchMint(TWO_ADDRESSES, [MINT], { from: operator }), "EdgeToken: values and recipients are not equal.");
            });
            it("revert mint to over 256 addresses", async () => {
              await expectRevert(this.token.batchMint(THREE_HUNDRED_ADDRESS, THREE_HUNDRED_NUMBERS, { from: operator }), "EdgeToken: greater than BATCH_LIMIT");
            });
          });
          describe("functional", () => {
            describe("batch mint 2 addresses", () => {
              beforeEach(async () => {
                await this.token.batchMint(TWO_ADDRESSES, [MINT, MINT], { from: operator });
              });
              it("first address balance updated", async () => {
                assert.equal(await this.token.balanceOf(TWO_ADDRESSES[0]), MINT);
              });
              it("second address balance updated", async () => {
                assert.equal(await this.token.balanceOf(TWO_ADDRESSES[1]), MINT);
              });
              it("total supply updated", async () => {
                assert.equal(await this.token.totalSupply(), MINT + MINT);
              });
            });
          });
        }); // end of batch
      }); // End of mint
      context("burnable", () => {
        beforeEach(async () => {
          await this.token.batchMint([whitelisted, frozen], [MINT, MINT], { from: operator });
        });
        describe("burnFor", () => {
          describe("non-batch", () => {
            describe("whitelisted/unwhitelisted", () => {
              describe("non-functional", () => {
                it("revert unwhitelisted", async () => {
                  await expectRevert(this.token.burnFor(notWhitelisted, BURN, { from: operator }), "Whitelistable: account is not whitelisted");
                });
                it("revert from attacker", async () => {
                  await expectRevert(this.token.burnFor(whitelisted, BURN, { from: attacker }), "Operatorable: caller does not have the operator role.");
                });
                it("revert for empty address", async () => {
                  await expectRevert(this.token.burnFor(ZERO_ADDRESS, BURN, { from: operator }), "Whitelistable: account is not whitelisted");
                });
                it("revert for over burn balance", async () => {
                  await expectRevert(this.token.burnFor(whitelisted, this.overflow, { from: operator }), "ERC20: burn amount exceeds balance.");
                });
                it("revert system burnFor", async () => {
                  await expectRevert(this.token.burnFor(whitelisted, BURN, { from: system }), "Operatorable: caller does not have the operator role.");
                });
              });
              describe("functional", () => {
                describe("from operator", () => {
                  beforeEach(async () => {
                    await this.token.burnFor(whitelisted, BURN, { from: operator });
                  });
                  it("balance updated", async () => {
                    assert.equal(await this.token.balanceOf(whitelisted), MINT - BURN);
                  });
                });
              });
            });
            describe("frozen", () => {
              describe("non-functional", () => {
                it("revert system burnFor frozen", async () => {
                  await expectRevert(this.token.burnFor(frozen, BURN, { from: system }), "Operatorable: caller does not have the operator role.");
                });
              });
              describe("functional", () => {
                describe("from operator", () => {
                  beforeEach(async () => {
                    await this.token.burnFor(frozen, BURN, { from: operator });
                  });
                  it("balance updated", async () => {
                    assert.equal(await this.token.balanceOf(frozen), MINT - BURN);
                  });
                });
              });
            });
            describe("paused", () => {
              beforeEach(async () => {
                await this.token.pause({ from: operator });
              });
              describe("non-functional", () => {
                describe("revert operator burnFor", () => {
                  beforeEach(async () => {
                    await expectRevert(this.token.burnFor(frozen, BURN, { from: operator }), "Pausable: paused.");
                  });
                });
              });
            });
          }); // end of non-batch
          describe("batch", () => {
            describe("whitelist", () => {
              beforeEach(async () => {
                await this.whitelist.batchToggleWhitelist(TWO_ADDRESSES, true, { from: operator });
              });
              describe("minted", () => {
                beforeEach(async () => {
                  await this.token.batchMint(TWO_ADDRESSES, [MINT, MINT], { from: operator });
                });
                describe("non-functional", () => {
                  it("revert address count and value count not equal", async () => {
                    await expectRevert(this.token.batchBurnFor(TWO_ADDRESSES, [BURN], { from: operator }), "EdgeToken: values and recipients are not equal.");
                  });
                  it("revert burnFor over 256 addresses", async () => {
                    await expectRevert(
                      this.token.batchBurnFor(THREE_HUNDRED_ADDRESS, THREE_HUNDRED_NUMBERS, { from: operator }),
                      "EdgeToken: batch count is greater than BATCH_LIMIT"
                    );
                  });
                });
                describe("functional", () => {
                  describe("batch burnFor 2 addresses", () => {
                    beforeEach(async () => {
                      await this.token.batchBurnFor(TWO_ADDRESSES, [BURN, BURN], { from: operator });
                    });
                    it("first address balance updated", async () => {
                      assert.equal(await this.token.balanceOf(TWO_ADDRESSES[0]), MINT - BURN);
                    });
                    it("second address balance updated", async () => {
                      assert.equal(await this.token.balanceOf(TWO_ADDRESSES[1]), MINT - BURN);
                    });
                  });
                });
              });
            });
          }); // end of batch
        }); // End of burnFor
        describe("burn", () => {
          describe("non-functional", () => {
            it("revert for over burn balance", async () => {
              await expectRevert(this.token.burn(this.overflow, { from: whitelisted }), "ERC20: burn amount exceeds balance.");
            });
            it("revert for notWhitelisted", async () => {
              await expectRevert(this.token.burn(BURN, { from: notWhitelisted }), "Whitelistable: account is not whitelisted");
            });
            it("revert for frozen whitelisted ", async () => {
              await expectRevert(this.token.burn(BURN, { from: frozen }), "EdgeToken: Account must not be frozen");
            });
            describe("paused", () => {
              beforeEach(async () => {
                await this.token.pause({ from: operator });
              });
              it("revert when paused", async () => {
                await expectRevert(this.token.burn(BURN, { from: whitelisted }), "Pausable: paused");
              });
            });
            describe("functional", () => {
              describe("burn from whitelisted", () => {
                beforeEach(async () => {
                  await this.token.burn(BURN, { from: whitelisted });
                });
                it("balance updated", async () => {
                  assert.equal(await this.token.balanceOf(whitelisted), MINT - BURN, "amount has not been burnt");
                });
              });
            });
          });
        }); // End of burn
      }); // End of burnable
      context("confiscate", () => {
        beforeEach(async () => {
          await this.token.batchMint([whitelisted, whitelisted1, frozen, frozen1], [MINT, MINT, MINT, MINT], { from: operator });
          this.confiscate = 50; // TODO constant import
        });
        describe("unwhitelisted", async () => {
          describe("non-batch", async () => {
            describe("non-functional", async () => {
              it("revert confiscate from nonwhitelisted address to whitelisted", async () => {
                await expectRevert(
                  this.token.confiscate(notWhitelisted, whitelisted, this.confiscate, { from: operator }),
                  "Whitelistable: account is not whitelisted"
                );
              });
              it("revert confiscate from whitelisted address to nonwhitelisted", async () => {
                await expectRevert(
                  this.token.confiscate(whitelisted, notWhitelisted, this.confiscate, { from: operator }),
                  "Whitelistable: account is not whitelisted"
                );
              });
              it("revert confiscate from non-operator", async () => {
                await expectRevert(
                  this.token.confiscate(whitelisted, whitelisted2, this.confiscate, { from: admin }),
                  "Operatorable: caller does not have the operator role"
                );
              });
              it("revert confiscate not enough balance", async () => {
                await expectRevert(
                  this.token.confiscate(whitelisted2, whitelisted, this.confiscate, { from: operator }),
                  "ERC20: transfer amount exceeds balance."
                );
              });
              describe("when paused", async () => {
                beforeEach(async () => {
                  await this.token.pause({ from: operator });
                });
                it("revert confiscate when paused", async () => {
                  await expectRevert(this.token.confiscate(whitelisted, whitelisted2, this.confiscate, { from: operator }), "Pausable: paused");
                });
              });
            });
            describe("functional", async () => {
              describe("confiscate from operator", () => {
                beforeEach(async () => {
                  await this.token.confiscate(whitelisted, whitelisted2, this.confiscate, { from: operator });
                });
                it("balance updated", async () => {
                  assert.equal(await this.token.balanceOf(whitelisted2), this.confiscate);
                });
              });
            });
          });
          describe("non-batch", async () => {
            describe("non-functional", async () => {
              it("revert confiscatees and values not equal", async () => {
                await expectRevert(
                  this.token.batchConfiscate(TWO_ADDRESSES, TWO_ADDRESSES, [MINT], { from: operator }),
                  "EdgeToken: values and recipients are not equal"
                );
              });
              it("revert receivers and values not equal", async () => {
                await expectRevert(
                  this.token.batchConfiscate(TWO_ADDRESSES, [TWO_ADDRESSES[0]], [MINT, MINT], { from: operator }),
                  "EdgeToken: values and recipients are not equal"
                );
              });
              it("revert confiscate to over 256 addresses", async () => {
                await expectRevert(
                  this.token.batchConfiscate(THREE_HUNDRED_ADDRESS, THREE_HUNDRED_ADDRESS, THREE_HUNDRED_NUMBERS, { from: operator }),
                  "EdgeToken: batch count is greater than BATCH_LIMIT"
                );
              });
            });
            describe("functional", () => {
              describe("confiscate batch 2 addresses", () => {
                beforeEach(async () => {
                  await this.whitelist.batchToggleWhitelist(TWO_ADDRESSES, true, { from: operator });
                });
                describe("when whitelisted", () => {
                  beforeEach(async () => {
                    await this.token.batchConfiscate([whitelisted, whitelisted1], TWO_ADDRESSES, [BURN, BURN], { from: operator });
                  });
                  it("first address balance updated", async () => {
                    assert.equal(await this.token.balanceOf(whitelisted), MINT - BURN);
                  });
                  it("second address balance updated", async () => {
                    assert.equal(await this.token.balanceOf(whitelisted1), MINT - BURN);
                  });
                });
              });
            });
          });
        });
      });
      context("transfer", () => {
        beforeEach(async () => {
          await this.token.batchMint([whitelisted, whitelisted1, frozen, frozen1], [MINT, MINT, MINT, MINT], { from: operator });
        });
        describe("unwhitelisted", async () => {
          describe("non-functional", async () => {
            it("revert whitelisted transfer to notWhitelisted", async () => {
              await expectRevert(this.token.transfer(notWhitelisted, TRANSFER, { from: whitelisted }), "Whitelistable: account is not whitelisted");
            });
          });
        });
        describe("whitelisted", async () => {
          describe("non-functional", async () => {
            it("revert transfer to empty address", async () => {
              await expectRevert(this.token.transfer(ZERO_ADDRESS, TRANSFER, { from: whitelisted }), "Whitelistable: account is not whitelisted");
            });
            it("revert transfer more than balance", async () => {
              await expectRevert(this.token.transfer(whitelisted1, MINT + TRANSFER, { from: whitelisted }), "ERC20: transfer amount exceeds balance.");
            });
          });
          describe("functional", async () => {
            describe("whitelist transfer to whitelist", () => {
              beforeEach(async () => {
                await this.token.transfer(whitelisted1, TRANSFER, { from: whitelisted });
              });
              it("sender balance updated", async () => {
                assert.equal(await this.token.balanceOf(whitelisted), MINT - TRANSFER);
              });
              it("reciever balance updated", async () => {
                assert.equal(await this.token.balanceOf(whitelisted1), MINT + TRANSFER);
              });
              describe("and transfer back", () => {
                beforeEach(async () => {
                  await this.token.transfer(whitelisted, TRANSFER, { from: whitelisted1 });
                });
                it("sender balance updated", async () => {
                  assert.equal(await this.token.balanceOf(whitelisted), MINT);
                });
                it("receiver balance updated", async () => {
                  assert.equal(await this.token.balanceOf(whitelisted1), MINT);
                });
              });
            });
          });
        });
        describe("frozen", async () => {
          describe("non-functional", () => {
            it("revert whitelist transfer to frozen", async () => {
              await expectRevert(this.token.transfer(frozen, TRANSFER, { from: whitelisted }), "Freezable: account is frozen");
            });
            it("revert frozen transfer to whitelisted", async () => {
              await expectRevert(this.token.transfer(whitelisted, TRANSFER, { from: frozen }), "Freezable: account is frozen");
            });
            it("revert frozen transfer to frozen", async () => {
              await expectRevert(this.token.transfer(frozen1, TRANSFER, { from: frozen }), "Freezable: account is frozen");
            });
          });
        });
        describe("pause", async () => {
          beforeEach(async () => {
            await this.token.pause({ from: operator });
          });
          it("revert all transfers", async () => {
            await expectRevert(this.token.transfer(whitelisted1, TRANSFER, { from: whitelisted }), "Pausable: paused");
          });
        });
      }); // End of transfer
      context("approval/allowances/transferFrom/burnFrom", () => {
        beforeEach(async () => {
          await this.token.batchMint([whitelisted, frozen, frozen1], [MINT, MINT, MINT], { from: operator });
          this.approve = 50; // TODO constant import
        });
        describe("approval", async () => {
          beforeEach(() => {
            this.approvalModification = 25;
          });
          describe("non-functional", () => {
            describe("non-whitelisted", async () => {
              it("revert notWhitelisted approval to whitelisted", async () => {
                await expectRevert(this.token.approve(whitelisted, this.approve, { from: notWhitelisted }), "Whitelistable: account is not whitelisted");
              });
              it("revert whitelisted approval to notWhitelisted", async () => {
                await expectRevert(this.token.approve(notWhitelisted, this.approve, { from: whitelisted }), "Whitelistable: account is not whitelisted");
              });
              it("revert whitelisted approval to notWhitelisted", async () => {
                await expectRevert(this.token.approve(notWhitelisted, this.approve, { from: whitelisted }), "Whitelistable: account is not whitelisted");
              });
            });
            describe("frozen", async () => {
              it("revert whitelisted approve frozen", async () => {
                await expectRevert(this.token.approve(frozen, this.approve, { from: whitelisted }), "Freezable: account is frozen");
              });
              it("revert frozen approve whitelisted", async () => {
                await expectRevert(this.token.approve(whitelisted, this.approve, { from: frozen }), "Freezable: account is frozen");
              });
              it("revert frozen approve frozen", async () => {
                await expectRevert(this.token.approve(frozen1, this.approve, { from: frozen }), "Freezable: account is frozen");
              });
            });
            it("revert empty address spender", async () => {
              await expectRevert(this.token.approve(ZERO_ADDRESS, this.approve, { from: whitelisted }), "Whitelistable: account is not whitelisted");
            });
            describe("paused approval", () => {
              beforeEach(async () => {
                await this.token.pause({ from: operator });
              });
              it("revert approve when paused", async () => {
                await expectRevert(this.token.approve(whitelisted2, this.approve, { from: whitelisted }), "Pausable: paused");
              });
            });
          });
          describe("functional", () => {
            describe("whitelist to whitelist", () => {
              beforeEach(async () => {
                await this.token.approve(whitelisted, this.approve, { from: whitelisted1 });
              });
              it("allowance updated", async () => {
                assert.equal(await this.token.allowance(whitelisted1, whitelisted), this.approve);
              });
            });
          });
          describe("increaseAllowance", () => {
            beforeEach(async () => {
              await this.token.approve(whitelisted, this.approve, { from: whitelisted1 });
            });
            describe("non-functional", () => {
              describe("non-whitelisted", async () => {
                it("revert notWhitelisted increase allowance to whitelisted", async () => {
                  await expectRevert(
                    this.token.increaseAllowance(whitelisted, this.approve, { from: notWhitelisted }),
                    "Whitelistable: account is not whitelisted"
                  );
                });
                it("revert whitelisted increase allowance to notWhitelisted", async () => {
                  await expectRevert(
                    this.token.increaseAllowance(notWhitelisted, this.approve, { from: whitelisted }),
                    "Whitelistable: account is not whitelisted"
                  );
                });
              });
              describe("frozen", async () => {
                it("revert whitelist increase frozen", async () => {
                  await expectRevert(this.token.increaseAllowance(frozen, this.approvalModification, { from: whitelisted }), "Freezable: account is frozen");
                });
                it("revert frozen increase whitelisted", async () => {
                  await expectRevert(this.token.increaseAllowance(whitelisted, this.approvalModification, { from: frozen }), "Freezable: account is frozen");
                });
                it("revert frozen increase frozen", async () => {
                  await expectRevert(this.token.increaseAllowance(frozen1, this.approvalModification, { from: frozen }), "Freezable: account is frozen");
                });
              });
              it("revert empty address", async () => {
                await expectRevert(
                  this.token.increaseAllowance(ZERO_ADDRESS, this.approvalModification, { from: whitelisted1 }),
                  "Whitelistable: account is not whitelisted"
                );
              });
              describe("paused increaseAllowance", () => {
                beforeEach(async () => {
                  await this.token.pause({ from: operator });
                });
                it("revert increaseAllowance when paused", async () => {
                  await expectRevert(this.token.increaseAllowance(whitelisted, this.approvalModification, { from: whitelisted1 }), "Pausable: paused");
                });
              });
            });
            describe("functional", () => {
              describe("increase allowance", () => {
                beforeEach(async () => {
                  await this.token.increaseAllowance(whitelisted, this.approvalModification, { from: whitelisted1 });
                });
                it("allowance updated", async () => {
                  assert.equal(await this.token.allowance(whitelisted1, whitelisted), this.approve + this.approvalModification);
                });
              });
            });
          }); // end of increaseAllowance
          describe("decreaseAllowance", () => {
            beforeEach(async () => {
              await this.token.approve(whitelisted, this.approve, { from: whitelisted1 });
            });
            describe("non-functional", () => {
              describe("non-whitelisted", async () => {
                it("revert notWhitelisted decrease allowance to whitelisted", async () => {
                  await expectRevert(
                    this.token.decreaseAllowance(whitelisted, this.approve, { from: notWhitelisted }),
                    "Whitelistable: account is not whitelisted"
                  );
                });
                it("revert whitelisted decrease allowance to notWhitelisted", async () => {
                  await expectRevert(
                    this.token.decreaseAllowance(notWhitelisted, this.approve, { from: whitelisted }),
                    "Whitelistable: account is not whitelisted"
                  );
                });
              });
              describe("frozen", async () => {
                it("revert whitelist decrease frozen", async () => {
                  await expectRevert(this.token.decreaseAllowance(frozen, this.approvalModification, { from: whitelisted }), "Freezable: account is frozen");
                });
                it("revert frozen decrease whitelisted", async () => {
                  await expectRevert(this.token.decreaseAllowance(whitelisted, this.approvalModification, { from: frozen }), "Freezable: account is frozen");
                });
                it("revert frozen decrease frozen", async () => {
                  await expectRevert(this.token.decreaseAllowance(frozen1, this.approvalModification, { from: frozen }), "Freezable: account is frozen");
                });
              });
              it("revert empty address", async () => {
                await expectRevert(
                  this.token.decreaseAllowance(ZERO_ADDRESS, this.approvalModification, { from: whitelisted1 }),
                  "Whitelistable: account is not whitelisted"
                );
              });
              it("revert overflow transferFrom", async () => {
                await expectRevert(
                  this.token.transferFrom(whitelisted1, whitelisted2, this.overflow, { from: whitelisted }),
                  "ERC20: transfer amount exceeds balance."
                );
              });
              describe("paused decreaseAllowance", () => {
                beforeEach(async () => {
                  await this.token.pause({ from: operator });
                });
                it("revert decreaseAllowance when paused", async () => {
                  await expectRevert(this.token.decreaseAllowance(whitelisted1, this.approvalModification, { from: whitelisted }), "Pausable: paused");
                });
              });
            });
            describe("functional", () => {
              describe("decrease allowance", () => {
                beforeEach(async () => {
                  await this.token.decreaseAllowance(whitelisted, this.approvalModification, { from: whitelisted1 });
                });
                it("allowance updated", async () => {
                  assert.equal(await this.token.allowance(whitelisted1, whitelisted), this.approve - this.approvalModification);
                });
              });
            });
          }); // end of decreaseAllowance
          describe("transferFrom/burnFrom", () => {
            describe("mint balance", () => {
              beforeEach(async () => {
                await this.token.mint(whitelisted1, MINT, { from: operator });
              });
              describe("approve balance", () => {
                beforeEach(async () => {
                  await this.token.approve(whitelisted, this.approve, { from: whitelisted1 });
                });
                describe("transferFrom", () => {
                  describe("non-functional", () => {
                    describe("frozen", async () => {
                      it("revert whitelisted transferFrom to frozen", async () => {
                        await expectRevert(this.token.transferFrom(whitelisted1, frozen, this.approve, { from: whitelisted }), "Freezable: account is frozen");
                      });
                      describe("when frozen", () => {
                        beforeEach(async () => {
                          await this.token.toggleFreeze(whitelisted, true, { from: operator });
                        });
                        it("revert frozen transferFrom to whitelisted", async () => {
                          await expectRevert(
                            this.token.transferFrom(whitelisted1, whitelisted2, this.approve, { from: whitelisted }),
                            "Freezable: account is frozen"
                          );
                        });
                      });
                    });
                    describe("non whitelisted", async () => {
                      it("revert nonwhitelisted transferFrom to whitelisted", async () => {
                        await expectRevert(
                          this.token.transferFrom(notWhitelisted, whitelisted2, this.approve, { from: whitelisted }),
                          "Whitelistable: account is not whitelisted"
                        );
                      });
                      it("revert nonwhitelisted transferFrom to whitelisted", async () => {
                        await expectRevert(
                          this.token.transferFrom(whitelisted1, whitelisted, this.approve, { from: notWhitelisted }),
                          "Whitelistable: account is not whitelisted"
                        );
                      });
                      it("revert nonwhitelisted transferFrom to whitelisted", async () => {
                        await expectRevert(
                          this.token.transferFrom(whitelisted, whitelisted1, this.approve, { from: notWhitelisted }),
                          "Whitelistable: account is not whitelisted"
                        );
                      });
                    });
                    describe("empty", async () => {
                      it("revert empty address sender", async () => {
                        await expectRevert(
                          this.token.transferFrom(ZERO_ADDRESS, whitelisted2, this.approve, { from: whitelisted }),
                          "Whitelistable: account is not whitelisted"
                        );
                      });
                      it("revert empty address recipient", async () => {
                        await expectRevert(
                          this.token.transferFrom(whitelisted1, ZERO_ADDRESS, this.approve, { from: whitelisted }),
                          "Whitelistable: account is not whitelisted"
                        );
                      });
                    });
                    it("revert overflow transferFrom", async () => {
                      await expectRevert(
                        this.token.transferFrom(whitelisted1, whitelisted2, this.overflow, { from: whitelisted }),
                        "ERC20: transfer amount exceeds balance."
                      );
                    });
                    describe("paused transferFrom", async () => {
                      beforeEach(async () => {
                        await this.token.pause({ from: operator });
                      });
                      it("revert all when paused", async () => {
                        await expectRevert(this.token.transferFrom(whitelisted1, whitelisted2, this.approve, { from: whitelisted }), "Pausable: paused");
                      });
                    });
                  });
                  describe("functional", () => {
                    describe("whitelisted transferFrom to whitelisted", () => {
                      beforeEach(async () => {
                        await this.token.transferFrom(whitelisted1, whitelisted2, this.approve, { from: whitelisted });
                      });
                      it("balance updated", async () => {
                        assert.equal(await this.token.balanceOf(whitelisted2), this.approve);
                      });
                    });
                  });
                }); // end of transferFrom
                describe("burnFrom", () => {
                  describe("non-functional", () => {
                    it("revert nonwhitelisted burnFrom to whitelisted", async () => {
                      await expectRevert(this.token.burnFrom(whitelisted, BURN, { from: notWhitelisted }), "Whitelistable: account is not whitelisted");
                    });
                    it("revert whitelisted burnFrom to frozen", async () => {
                      await expectRevert(this.token.burnFrom(frozen, BURN, { from: whitelisted }), "Freezable: account is frozen");
                    });
                    it("revert frozen transferFrom to whitelisted", async () => {
                      await expectRevert(this.token.burnFrom(whitelisted, this.approve, { from: frozen }), "Freezable: account is frozen");
                    });
                    it("revert overflow burnFrom", async () => {
                      await expectRevert(this.token.burnFrom(whitelisted1, this.overflow, { from: whitelisted }), "ERC20: burn amount exceeds balance.");
                    });
                    it("revert empty address ", async () => {
                      await expectRevert(this.token.burnFrom(ZERO_ADDRESS, this.overflow, { from: whitelisted }), "Whitelistable: account is not whitelisted");
                    });
                    describe("paused burnFrom", async () => {
                      beforeEach(async () => {
                        await this.token.pause({ from: operator });
                      });
                      it("revert all when paused", async () => {
                        await expectRevert(this.token.burnFrom(whitelisted1, BURN, { from: whitelisted }), "Pausable: paused");
                      });
                    });
                  });
                  describe("functional", () => {
                    describe("whitelisted burnFrom to whitelisted", () => {
                      beforeEach(async () => {
                        await this.token.burnFrom(whitelisted1, BURN, { from: whitelisted });
                      });
                      it("allowance updated", async () => {
                        assert.equal(await this.token.allowance(whitelisted1, whitelisted), this.approve - BURN);
                      });
                    });
                  });
                }); // end of burnFrom
              });
            });
          });
        }); // end of approval
      }); // approval/allowances/transferFrom
    });
  });
});
