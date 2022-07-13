const { load } = require("@sygnum/solidity-base-contracts");
const { assert } = require("chai");
const {
  getImplementation,
  encodeCall,
  expectRevert,
  EdgeToken,
  EdgeTokenConstructorUpgrade,
  EdgeTokenWhitelistableUpgrade,
  EdgeTokenBlockUnblockTraderUpgrade,
  EdgeTokenDecimalUpgrade,
  EdgeTokenSystemConfiscateUpgrade,
  EdgeTokenProxy,
} = require("../../common");

const { BaseOperators, Whitelist, TraderOperators, BlockerOperators } = load(EdgeToken.currentProvider);

contract("EdgeTokenSystemConfiscateUpgrade", ([owner, admin, operator, system, proxyAdmin, proxyAdminNew, attacker, whitelisted, whitelisted2, newAddress]) => {
  beforeEach(async () => {
    this.baseOperators = await BaseOperators.new(admin, { from: admin });

    await this.baseOperators.addOperator(operator, { from: admin });
    assert.equal(await this.baseOperators.isOperator(operator), true, "operator not set");

    await this.baseOperators.addSystem(system, { from: admin });
    assert.equal(await this.baseOperators.isSystem(system), true, "system not set");

    this.newWhitelist = await Whitelist.new({ from: admin });
    await this.newWhitelist.initialize(this.baseOperators.address, { from: admin });

    this.traderOperators = await TraderOperators.new({ from: admin });
    await this.traderOperators.initialize(this.baseOperators.address, { from: admin });

    this.blockerOperators = await BlockerOperators.new({ from: admin });
    await this.blockerOperators.initialize(this.baseOperators.address, { from: admin });

    this.tokenImpl = await EdgeToken.new();
    this.tokenImplConstructorUpgrade = await EdgeTokenConstructorUpgrade.new();
    this.tokenImplWhitelistUpgrade = await EdgeTokenWhitelistableUpgrade.new();
    this.tokenImplBlockUnblockUpgrade = await EdgeTokenBlockUnblockTraderUpgrade.new();
    this.tokenImplDecimalUpgrade = await EdgeTokenDecimalUpgrade.new();
    this.tokenImplSystemConfiscateUpgrade = await EdgeTokenSystemConfiscateUpgrade.new();

    const initializeSystemConfiscateData = encodeCall(
      "initialize",
      ["address", "address", "address", "address"],
      [this.baseOperators.address, this.newWhitelist.address, this.blockerOperators.address, this.traderOperators.address]
    );
    this.proxy = await EdgeTokenProxy.new(this.tokenImplSystemConfiscateUpgrade.address, proxyAdmin, initializeSystemConfiscateData, { from: owner });
    this.token = await EdgeTokenSystemConfiscateUpgrade.at(this.proxy.address);
  });

  context("deployed proxy", () => {
    context("upgradability", () => {
      it("check implementation set", async () => {
        assert.equal(await getImplementation(this.proxy), this.tokenImplSystemConfiscateUpgrade.address);
      });
      it("instance set", () => {
        assert.equal(this.token.address, this.proxy.address);
      });
      describe("testing v0", () => {
        it("baseOperators set", async () => {
          assert.equal(await this.token.getOperatorsContract(), this.baseOperators.address);
        });
        it("sets v0 upgrade flag to true", async () => {
          assert.equal(await this.token.isInitialized(), true);
        });
      });
      describe("testing v1 changes", () => {
        it("sets v1 upgrade flag to true", async () => {
          assert.equal(await this.token.initializedConstructorUpgrade(), true);
        });
        it("name updated", async () => {
          assert.equal(await this.token.name(), "Digital CHF");
        });
        it("symbol updated", async () => {
          assert.equal(await this.token.symbol(), "DCHF");
        });

        describe("constructor values initialized", () => {
          beforeEach(async () => {
            await this.newWhitelist.toggleWhitelist(whitelisted, true, { from: operator });
            await this.token.mint(whitelisted, 100, { from: operator });
          });
          it("ensure mint balance updated", async () => {
            assert.equal(await this.token.balanceOf(whitelisted), 100);
          });
          describe("old versions", () => {
            beforeEach(async () => {
              this.token = await EdgeToken.at(this.proxy.address);
              await this.token.mint(whitelisted, 100, { from: operator });
            });
            it("old version works", async () => {
              assert.equal(await this.token.balanceOf(whitelisted), 200);
            });
            describe("then switch to new versions", () => {
              beforeEach(async () => {
                this.token = await EdgeTokenSystemConfiscateUpgrade.at(this.proxy.address);
                await this.token.mint(whitelisted, 100, { from: operator });
              });
              it("new version works", async () => {
                assert.equal(await this.token.balanceOf(whitelisted), 300);
              });
            });
          });
        });
      });
      describe("testing v2 changes", () => {
        it("sets v2 upgrade flag to true", async () => {
          assert.equal(await this.token.initializedWhitelistableUpgrade(), true);
        });
        it("whitelist pointer updated", async () => {
          assert.equal(await this.token.getWhitelistContract(), this.newWhitelist.address);
        });
        describe("set token instance", () => {
          describe("constructor values initialized", () => {
            beforeEach(async () => {
              await this.newWhitelist.toggleWhitelist(whitelisted, true, { from: operator });
              await this.token.mint(whitelisted, 100, { from: operator });
            });
            it("ensure mint balance updated", async () => {
              assert.equal(await this.token.balanceOf(whitelisted), 100);
            });
            describe("old versions", () => {
              beforeEach(async () => {
                this.token = await EdgeToken.at(this.proxy.address);
                await this.token.mint(whitelisted, 100, { from: operator });
              });
              it("old version works", async () => {
                assert.equal(await this.token.balanceOf(whitelisted), 200);
              });
              describe("then switch to new versions", () => {
                beforeEach(async () => {
                  this.token = await EdgeTokenSystemConfiscateUpgrade.at(this.proxy.address);
                  await this.token.mint(whitelisted, 100, { from: operator });
                });
                it("new version works", async () => {
                  assert.equal(await this.token.balanceOf(whitelisted), 300);
                });
              });
            });
          });
        });
      });
      describe("testing v3 changes", () => {
        it("sets v3 upgrade flag to true", async () => {
          assert.equal(await this.token.initializedBlockUnblockTraderUpgrade(), true);
        });
        it("blockerOperators pointer updated", async () => {
          assert.equal(await this.token.getBlockerOperatorsContract(), this.blockerOperators.address);
        });
        it("traderOperators pointer updated", async () => {
          assert.equal(await this.token.getTraderOperatorsContract(), this.traderOperators.address);
        });
      });
      describe("testing v4 changes", () => {
        it("sets v4 upgrade flag to true", async () => {
          assert.equal(await this.token.initializedDecimalUpgrade(), true);
        });
        it("new decimals is correct", async () => {
          assert.equal(await this.token.decimals(), 6);
        });
        it("storage is preserved", async () => {
          assert.equal(await this.token.name(), "Digital CHF");
          assert.equal(await this.token.symbol(), "DCHF");
        });
      });
      describe("testing v5 changes", () => {
        it("sets v5 upgrade flag to true", async () => {
          assert.equal(await this.token.initializedSystemConfiscate(), true);
        });
        describe("old versions", () => {
          beforeEach(async () => {
            this.token = await EdgeToken.at(this.proxy.address);

            await this.newWhitelist.toggleWhitelist(whitelisted, true, { from: operator });
            await this.newWhitelist.toggleWhitelist(whitelisted2, true, { from: operator });

            await this.token.mint(whitelisted, 100, { from: operator });
            this.confiscate = 50;
          });
          describe("confiscate by operator", () => {
            beforeEach(async () => {
              await this.token.confiscate(whitelisted, whitelisted2, this.confiscate, { from: operator });
            });
            it("balance updated", async () => {
              assert.equal(await this.token.balanceOf(whitelisted2), this.confiscate);
            });
          });
          describe("cannot confiscate by system", () => {
            beforeEach(async () => {
              await this.proxy.upgradeTo(this.tokenImpl.address, { from: proxyAdmin });
              this.token = await EdgeToken.at(this.proxy.address);

              // check baseOperators address equal to address in proxy
              assert.equal(await this.baseOperators.address, await this.token.getOperatorsContract());
              // check that system does not have operators role
              assert.equal(await this.baseOperators.isOperator(system), false);
              // try confiscate from whitelisted (non-system, non-operator)
              // error message is "caller does not have the operator role nor system"
              // this means implementation is not being set to EdgeToken for some reason
              await expectRevert(this.token.confiscate(whitelisted, whitelisted2, this.confiscate, { from: whitelisted }), "OperatorableCallerNotOperator()");

              // if everything worked, this should revert
              await expectRevert(this.token.confiscate(whitelisted, whitelisted2, this.confiscate, { from: system }), "OperatorableCallerNotOperator()");
            });
            it("balance unaffected", async () => {
              assert.equal(await this.token.balanceOf(whitelisted2), 0);
            });
          });
          describe("then switch to new versions", () => {
            beforeEach(async () => {
              await this.proxy.upgradeTo(this.tokenImplSystemConfiscateUpgrade.address, { from: proxyAdmin });
              this.token = await EdgeTokenSystemConfiscateUpgrade.at(this.proxy.address);
              assert.equal(await this.token.getWhitelistContract(), this.newWhitelist.address);

              await this.newWhitelist.toggleWhitelist(whitelisted, true, { from: operator });
              await this.newWhitelist.toggleWhitelist(whitelisted2, true, { from: operator });

              await this.token.mint(whitelisted, 100, { from: operator });
              this.confiscate = 50;
            });
            describe("can confiscate by operator", () => {
              beforeEach(async () => {
                await this.token.confiscate(whitelisted, whitelisted2, this.confiscate, { from: operator });
              });
              it("balance updated", async () => {
                assert.equal(await this.token.balanceOf(whitelisted2), this.confiscate);
              });
            });
            describe("can confiscate by system", () => {
              beforeEach(async () => {
                await this.token.confiscate(whitelisted, whitelisted2, this.confiscate, { from: system });
              });
              it("balance updated", async () => {
                assert.equal(await this.token.balanceOf(whitelisted2), this.confiscate);
              });
            });
          });
        });
      });
    });
  });
});
