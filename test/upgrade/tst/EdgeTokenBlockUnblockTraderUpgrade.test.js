const {
  getAdmin,
  getImplementation,
  encodeCall,
  expectEvent,
  expectRevert,
  assertRevert,
  EdgeToken,
  EdgeTokenBlockUnblockTraderUpgrade,
  EdgeTokenProxy,
  ZERO_ADDRESS,
} = require("../../common");
const { BaseOperators, Whitelist, TraderOperators, BlockerOperators } = require("@sygnum/solidity-base-contracts");

contract("EdgeTokenBlockUnblockTraderUpgrade", ([owner, admin, operator, proxyAdmin, proxyAdminNew, attacker, whitelisted]) => {
  beforeEach(async () => {
    this.baseOperators = await BaseOperators.new(admin, { from: admin });
    await this.baseOperators.addOperator(operator, { from: admin });

    this.whitelist = await Whitelist.new({ from: admin });
    await this.whitelist.initialize(this.baseOperators.address, { from: admin });

    this.traderOperators = await TraderOperators.new({ from: admin });
    await this.traderOperators.initialize(this.baseOperators.address, { from: admin });

    this.blockerOperators = await BlockerOperators.new({ from: admin });
    await this.blockerOperators.initialize(this.baseOperators.address, { from: admin });

    this.tokenImpl = await EdgeToken.new();
    this.tokenImplUpgrade = await EdgeTokenBlockUnblockTraderUpgrade.new();
    const initializeData = encodeCall("initialize", ["address", "address"], [this.baseOperators.address, this.whitelist.address]);
    this.proxy = await EdgeTokenProxy.new(this.tokenImpl.address, proxyAdmin, initializeData, { from: owner });
    this.token = await EdgeToken.at(this.proxy.address);
  });

  context("deployed proxy", () => {
    describe("has implementation set", () => {
      it("check implementation set", async () => {
        assert.equal(await getImplementation(this.proxy), this.tokenImpl.address.toLowerCase());
      });
      describe("contracts initialized", () => {
        it("base operators", async () => {
          assert.equal(await this.token.getOperatorsContract(), this.baseOperators.address);
        });
        it("whitelist", async () => {
          assert.equal(await this.token.getWhitelistContract(), this.whitelist.address);
        });
      });
    });
    context("admin set", () => {
      it("check admin set", async () => {
        assert.equal(await getAdmin(this.proxy), proxyAdmin.toLowerCase());
      });
      describe("non-functional", () => {
        it("admin transfer admin", async () => {
          ({ logs: this.logs } = await this.proxy.changeAdmin(proxyAdminNew, { from: proxyAdmin }));
          assert.equal(await getAdmin(this.proxy), proxyAdminNew.toLowerCase());
        });
        it("emits a AdminChanged event", () => {
          expectEvent.inLogs(this.logs, "AdminChanged", { previousAdmin: proxyAdmin, newAdmin: proxyAdminNew });
        });
      });
      describe("functional", () => {
        it("admin transfer admin", async () => {
          ({ logs: this.logs } = await this.proxy.changeAdmin(proxyAdminNew, { from: proxyAdmin }));
          assert.equal(await getAdmin(this.proxy), proxyAdminNew.toLowerCase());
        });
        it("emits a AdminChanged event", () => {
          expectEvent.inLogs(this.logs, "AdminChanged", { previousAdmin: proxyAdmin, newAdmin: proxyAdminNew });
        });
      });
      describe("change admin", () => {
        describe("from proxy admin", () => {
          it("can transfer admin", async () => {
            ({ logs: this.logs } = await this.proxy.changeAdmin(proxyAdminNew, { from: proxyAdmin }));
            assert.equal(await getAdmin(this.proxy), proxyAdminNew.toLowerCase());
          });
          it("emits a AdminChanged event", () => {
            expectEvent.inLogs(this.logs, "AdminChanged", { previousAdmin: proxyAdmin, newAdmin: proxyAdminNew });
          });
          it("reverts when assigning empty address", async () => {
            await expectRevert(this.proxy.changeAdmin(ZERO_ADDRESS, { from: proxyAdmin }), "Cannot change the admin of a proxy to the zero address.");
          });
          describe("from token admin", () => {
            it("reverts", async () => {
              await assertRevert(this.proxy.changeAdmin(proxyAdminNew, { from: admin }));
            });
          });
          describe("from attacker", () => {
            it("reverts", async () => {
              await assertRevert(this.proxy.changeAdmin(proxyAdminNew, { from: attacker }));
            });
          });
        });
      });
    });
    context("upgradability", () => {
      describe("upgrade to", () => {
        beforeEach(async () => {
          this.initializeBlockerTraderOperatorsData = encodeCall(
            "initializeBlockerTraderOperators",
            ["address", "address"],
            [this.blockerOperators.address, this.traderOperators.address]
          );
        });
        describe("from proxy admin", async () => {
          describe("functional", () => {
            beforeEach(async () => {
              await this.proxy.upgradeTo(this.tokenImplUpgrade.address, { from: proxyAdmin });
            });
            it("implementation updated", async () => {
              assert.equal(await getImplementation(this.proxy), this.tokenImplUpgrade.address.toLowerCase());
            });
          });
          describe("non-functional", () => {
            it("reverts when implementation empty address", async () => {
              await expectRevert(this.proxy.upgradeTo(ZERO_ADDRESS, { from: proxyAdmin }), "Cannot set a proxy implementation to a non-contract address.");
            });
          });
        });
        describe("upgrade and call", () => {
          describe("functional", () => {
            describe("from proxy admin", () => {
              beforeEach(async () => {
                await this.proxy.upgradeToAndCall(this.tokenImplUpgrade.address, this.initializeBlockerTraderOperatorsData, { from: proxyAdmin });
              });
              it("implementation set", async () => {
                assert.equal(await getImplementation(this.proxy), this.tokenImplUpgrade.address.toLowerCase());
              });
            });
          });
          describe("non-functional", () => {
            it("reverts from token admin", async () => {
              await assertRevert(this.proxy.upgradeToAndCall(this.tokenImplUpgrade.address, this.initializeBlockerTraderOperatorsData, { from: admin }));
            });
            it("reverts when implementation empty address", async () => {
              await assertRevert(this.proxy.upgradeToAndCall(ZERO_ADDRESS, this.initializeBlockerTraderOperatorsData, { from: admin }));
            });
          });
        });
        context("upgrade and call", () => {
          beforeEach(async () => {
            await this.proxy.upgradeToAndCall(this.tokenImplUpgrade.address, this.initializeBlockerTraderOperatorsData, { from: proxyAdmin });
          });
          describe("set token instance", () => {
            beforeEach(async () => {
              this.token = await EdgeTokenBlockUnblockTraderUpgrade.at(this.proxy.address);
            });
            it("instance set", async () => {
              assert.equal(this.token.address, this.proxy.address);
            });
            it("blockerOperators pointer updated", async () => {
              assert.equal(await this.token.getBlockerOperatorsContract(), this.blockerOperators.address);
            });
            it("traderOperators pointer updated", async () => {
              assert.equal(await this.token.getTraderOperatorsContract(), this.traderOperators.address);
            });
          });
        });
      });
    });
  });
});
