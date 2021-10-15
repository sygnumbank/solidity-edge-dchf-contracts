const { load } = require("@sygnum/solidity-base-contracts");
const {
  getImplementation,
  encodeCall,
  expectRevert,
  EdgeToken,
  EdgeTokenConstructorUpgrade,
  EdgeTokenWhitelistableUpgrade,
  EdgeTokenBlockUnblockTraderUpgrade,
  EdgeTokenDecimalUpgrade,
  EdgeTokenProxy,
  ZERO_ADDRESS,
} = require("../../common");

const { BaseOperators, Whitelist, TraderOperators, BlockerOperators } = load(EdgeToken.currentProvider);

contract("EdgeTokenDecimalUpgrade", ([owner, admin, operator, proxyAdmin, proxyAdminNew, attacker, whitelisted, newAddress]) => {
  beforeEach(async () => {
    this.baseOperators = await BaseOperators.new(admin, { from: admin });

    await this.baseOperators.addOperator(operator, { from: admin });
    assert.equal(await this.baseOperators.isOperator(operator), true, "operator not set");

    this.whitelist = await Whitelist.new({ from: admin });
    await this.whitelist.initialize(this.baseOperators.address, { from: admin });

    this.traderOperators = await TraderOperators.new({ from: admin });
    await this.traderOperators.initialize(this.baseOperators.address, { from: admin });

    this.blockerOperators = await BlockerOperators.new({ from: admin });
    await this.blockerOperators.initialize(this.baseOperators.address, { from: admin });

    this.tokenImpl = await EdgeToken.new();
    this.tokenImplConstructorUpgrade = await EdgeTokenConstructorUpgrade.new();
    this.tokenImplWhitelistUpgrade = await EdgeTokenWhitelistableUpgrade.new();
    this.tokenImplBlockUnblockUpgrade = await EdgeTokenBlockUnblockTraderUpgrade.new();
    this.tokenImplDecimalUpgrade = await EdgeTokenDecimalUpgrade.new();
    const initializeData = encodeCall("initialize", ["address", "address"], [this.baseOperators.address, this.whitelist.address]);
    this.proxy = await EdgeTokenProxy.new(this.tokenImpl.address, proxyAdmin, initializeData, { from: owner });
    this.token = await EdgeToken.at(this.proxy.address);
  });

  context("deployed proxy", () => {
    describe("has implementation set", () => {
      it("check implementation set", async () => {
        assert.equal(await getImplementation(this.proxy), this.tokenImpl.address);
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
    context("upgradability", () => {
      describe("upgrade to ConstructorUpgrade", () => {
        beforeEach(() => {
          this.initializeDataV1 = encodeCall("initializeConstructor");
        });
        context("upgrade and call", () => {
          describe("constructor values initialized", () => {
            beforeEach(async () => {
              await this.proxy.upgradeToAndCall(this.tokenImplConstructorUpgrade.address, this.initializeDataV1, { from: proxyAdmin });
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
            describe("upgrade ConstructorUpgrade to WhitelistUpgrade", () => {
              beforeEach(async () => {
                this.newWhitelist = await Whitelist.new({ from: admin });
                await this.newWhitelist.initialize(this.baseOperators.address, { from: admin });
                this.initializeWhitelistData = encodeCall("initializeWhitelist", ["address"], [this.newWhitelist.address]);
                await this.proxy.upgradeToAndCall(this.tokenImplWhitelistUpgrade.address, this.initializeWhitelistData, { from: proxyAdmin });
              });
              it("implementation set", async () => {
                assert.equal(await getImplementation(this.proxy), this.tokenImplWhitelistUpgrade.address);
              });
              it("whitelist pointer updated", async () => {
                assert.equal(await this.token.getWhitelistContract(), this.newWhitelist.address);
              });
              describe("set token instance", () => {
                beforeEach(async () => {
                  this.token = await EdgeTokenWhitelistableUpgrade.at(this.proxy.address);
                });
                it("instance set", async () => {
                  assert.equal(this.token.address, this.proxy.address);
                });
                it("whitelist pointer updated", async () => {
                  assert.equal(await this.token.getWhitelistContract(), this.newWhitelist.address);
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
                        this.token = await EdgeTokenWhitelistableUpgrade.at(this.proxy.address);
                        await this.token.mint(whitelisted, 100, { from: operator });
                      });
                      it("new version works", async () => {
                        assert.equal(await this.token.balanceOf(whitelisted), 300);
                      });
                    });
                  });
                });
              });
              describe("upgrade WhitelistUpgrade to BlockUnblockUpgrade", () => {
                beforeEach(async () => {
                  this.initializeBlockerTraderOperatorsData = encodeCall(
                    "initializeBlockerTraderOperators",
                    ["address", "address"],
                    [this.blockerOperators.address, this.traderOperators.address]
                  );
                  await this.proxy.upgradeTo(this.tokenImplBlockUnblockUpgrade.address, { from: proxyAdmin });
                });
                describe("from proxy admin", async () => {
                  describe("functional", () => {
                    it("implementation updated", async () => {
                      assert.equal(await getImplementation(this.proxy), this.tokenImplBlockUnblockUpgrade.address);
                    });
                  });
                  describe("non-functional", () => {
                    it("reverts when implementation empty address", async () => {
                      await expectRevert(
                        this.proxy.upgradeTo(ZERO_ADDRESS, { from: proxyAdmin }),
                        "Cannot set a proxy implementation to a non-contract address"
                      );
                    });
                  });
                });
                context("upgrade and call", () => {
                  beforeEach(async () => {
                    await this.proxy.upgradeToAndCall(this.tokenImplBlockUnblockUpgrade.address, this.initializeBlockerTraderOperatorsData, {
                      from: proxyAdmin,
                    });
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
                describe("upgrade BlockUnblockUpgrade to DecimalUpgrade", () => {
                  beforeEach(async () => {
                    this.initializeDecimalsData = encodeCall("initializeDecimalsConstructor");
                    await this.proxy.upgradeToAndCall(this.tokenImplDecimalUpgrade.address, this.initializeDecimalsData, { from: proxyAdmin });
                  });
                  describe("set token instance", () => {
                    beforeEach(async () => {
                      this.token = await EdgeTokenDecimalUpgrade.at(this.proxy.address);
                    });
                    it("instance set", async () => {
                      assert.equal(this.token.address, this.proxy.address);
                    });
                    it("decimals updated", async () => {
                      assert.equal(await this.token.decimals(), 6);
                    });
                    it("storage is preserved", async () => {
                      assert.equal(await this.token.name(), "Digital CHF");
                      assert.equal(await this.token.symbol(), "DCHF");
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
