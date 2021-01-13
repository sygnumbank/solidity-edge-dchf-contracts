const { load } = require("@sygnum/solidity-base-contracts");
const {
  getAdmin,
  getImplementation,
  encodeCall,
  expectEvent,
  expectRevert,
  assertRevert,
  EdgeToken,
  EdgeTokenConstructorUpgrade,
  EdgeTokenProxy,
  ZERO_ADDRESS,
} = require("../../common");

const { BaseOperators, Whitelist } = load(EdgeToken.currentProvider);

contract("EdgeTokenConstructorUpgrade", ([owner, admin, operator, proxyAdmin, proxyAdminNew, attacker, whitelisted, newAddress]) => {
  beforeEach(async () => {
    this.baseOperators = await BaseOperators.new(admin, { from: admin });

    await this.baseOperators.addOperator(operator, { from: admin });
    assert.equal(await this.baseOperators.isOperator(operator), true, "operator not set");

    this.whitelist = await Whitelist.new({ from: admin });
    await this.whitelist.initialize(this.baseOperators.address, { from: admin });

    this.tokenImpl = await EdgeToken.new();
    this.tokenImplUpgrade = await EdgeTokenConstructorUpgrade.new();
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
        describe("functional", () => {
          describe("from proxy admin", () => {
            it("can transfer admin", async () => {
              ({ logs: this.logs } = await this.proxy.changeAdmin(proxyAdminNew, { from: proxyAdmin }));
              assert.equal(await getAdmin(this.proxy), proxyAdminNew.toLowerCase());
            });
            it("emits a AdminChanged event", () => {
              expectEvent.inLogs(this.logs, "AdminChanged", { previousAdmin: proxyAdmin, newAdmin: proxyAdminNew });
            });
          });
        });
        describe("functional", () => {
          it("reverts when assigning empty address", async () => {
            await expectRevert(this.proxy.changeAdmin(ZERO_ADDRESS, { from: proxyAdmin }), "Cannot change the admin of a proxy to the zero address.");
          });
          it("revert from token admin", async () => {
            await assertRevert(this.proxy.changeAdmin(proxyAdminNew, { from: admin }));
          });
          it("revert from attacker", async () => {
            await assertRevert(this.proxy.changeAdmin(proxyAdminNew, { from: attacker }));
          });
        });
      });
    });
    context("upgradability", () => {
      describe("upgrade to", () => {
        beforeEach(() => {
          this.initializeDataV1 = encodeCall("initializeConstructor");
        });
        describe("from proxy admin", async () => {
          describe("functional", () => {
            beforeEach(async () => {
              await this.proxy.upgradeTo(this.tokenImplUpgrade.address, { from: proxyAdmin });
            });
            it("new implementation set", async () => {
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
            describe("from admin", () => {
              beforeEach(async () => {
                await this.proxy.upgradeToAndCall(this.tokenImplUpgrade.address, this.initializeDataV1, { from: proxyAdmin });
              });
              it("implementation set", async () => {
                assert.equal(await getImplementation(this.proxy), this.tokenImplUpgrade.address.toLowerCase());
              });
            });
          });
          describe("non-functional", () => {
            it("reverts from token admin", async () => {
              await assertRevert(this.proxy.upgradeToAndCall(this.tokenImplUpgrade.address, this.initializeDataV1, { from: admin }));
            });
            it("reverts when implementation empty address", async () => {
              await assertRevert(this.proxy.upgradeToAndCall(ZERO_ADDRESS, this.initializeDataV1, { from: admin }));
            });
          });
        });
        context("upgrade and call", () => {
          describe("constructor values initialized", () => {
            beforeEach(async () => {
              await this.proxy.upgradeToAndCall(this.tokenImplUpgrade.address, this.initializeDataV1, { from: proxyAdmin });
            });
            describe("set token instance", () => {
              beforeEach(async () => {
                this.token = await EdgeTokenConstructorUpgrade.at(this.proxy.address);
              });
              it("instance set", () => {
                assert.equal(this.token.address, this.proxy.address);
              });
              it("name updated", async () => {
                assert.equal(await this.token.name(), "Digital CHF");
              });
              it("symbol updated", async () => {
                assert.equal(await this.token.symbol(), "DCHF");
              });
              it("decimals updated", async () => {
                assert.equal(await this.token.decimals(), 2);
              });
              describe("constructor values initialized", () => {
                beforeEach(async () => {
                  await this.whitelist.toggleWhitelist(whitelisted, true, { from: operator });
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
                      this.token = await EdgeTokenConstructorUpgrade.at(this.proxy.address);
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
        });
      });
    });
  });
});
