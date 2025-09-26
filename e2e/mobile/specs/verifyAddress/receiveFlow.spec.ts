describe("Receive Flow", () => {
  const account = Account.ETH_1;

  beforeAll(async () => {
    await app.init({
      speculosApp: account.currency.speculosApp,
      userdata: "EthAccountXrpAccountReadOnlyFalse",
    });

    await app.portfolio.waitForPortfolioPageToLoad();
  });

  async function openReceive() {
    await app.portfolio.openViaDeeplink();
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.receive.openViaDeeplink();
  }

  $TmsLink("B2CQA-1858");
  $TmsLink("B2CQA-1860");
  it("Should display the number of account existing per networks", async () => {
    await openReceive();
    await app.receive.selectAsset("ETH");
    await app.receive.expectNumberOfAccountInListIsDisplayed("ethereum", 3);
    await app.receive.expectNumberOfAccountInListIsDisplayed("optimism", 1);
  });

  $TmsLink("B2CQA-1856");
  $TmsLink("B2CQA-1862");
  it("Should create an account on a network", async () => {
    await openReceive();
    await app.receive.selectAsset("ETH");
    await app.receive.selectNetwork("optimism");
    await app.receive.createAccount();
    await app.receive.continueCreateAccount();
    await app.receive.expectAccountIsCreated("OP Mainnet 1");
  });

  $TmsLink("B2CQA-650");
  it("Should access to receive after importing a cryptocurrency on a selected network", async () => {
    await openReceive();
    await app.common.performSearch(Account.BSC_POL.currency.name);
    await app.receive.selectCurrency(Account.BSC_POL.currency.id);
    await app.receive.selectNetwork(Currency.BSC.id);
    await app.addAccount.addAccountAtIndex(Account.BSC_POL.accountName, Currency.BSC.id, 0);
    await app.addAccount.tapAddFunds();
    await app.addAccount.tapReceiveActionDrawer();
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed(
      Currency.BSC.ticker,
      Account.BSC_POL.accountName,
    );
  });

  $TmsLink("B2CQA-1859");
  it("Should access to receive after selecting an existing account", async () => {
    await openReceive();
    await app.receive.selectAsset("XRP");
    await app.common.selectAccount(Account.XRP_2);
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed("XRP", "XRP 2");
  });
});
