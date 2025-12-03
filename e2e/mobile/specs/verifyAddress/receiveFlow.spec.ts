import { ReceiveFundsOptions } from "@ledgerhq/live-common/lib/e2e/enum/ReceiveFundsOptions";

describe("Receive Flow", () => {
  const account = Account.ETH_1;

  beforeAll(async () => {
    await app.init({
      speculosApp: account.currency.speculosApp,
      userdata: "EthAccountXrpAccountReadOnlyFalse",
      featureFlags: {
        noah: {
          enabled: true,
        },
      },
    });

    await app.portfolio.waitForPortfolioPageToLoad();
  });

  beforeEach(async () => {
    await app.portfolio.openViaDeeplink();
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.portfolio.tapQuickActionReceiveButton();
    await app.receive.selectReceiveFundsOption(ReceiveFundsOptions.CRYPTO);
  });

  afterEach(async () => {
    await app.modularDrawer.tapDrawerCloseButton({ onlyIfVisible: true });
  });

  $TmsLink("B2CQA-1858");
  $TmsLink("B2CQA-1860");
  it("Should display the number of account existing per networks", async () => {
    const { ticker, name } = Account.ETH_1.currency;
    await app.modularDrawer.selectCurrencyByTicker(ticker);
    await app.modularDrawer.selectNetwork(name);
    await app.modularDrawer.validateNumberOfAccounts(3);

    await app.modularDrawer.tapDrawerBackButton();
    await app.modularDrawer.selectNetwork(Currency.OP.name);
    await app.modularDrawer.validateNumberOfAccounts(1);
  });

  $TmsLink("B2CQA-1856");
  $TmsLink("B2CQA-1862");
  it("Should create an account on a network", async () => {
    await app.modularDrawer.selectCurrencyByTicker(Account.ETH_1.currency.ticker);
    await app.modularDrawer.selectNetwork(Currency.OP.name);
    await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();

    await app.receive.continueCreateAccount();
    await app.receive.doNotVerifyAddress();

    await app.receive.expectReceivePageIsDisplayed("ETH", "OP Mainnet 1");
    await app.common.closePage();

    await app.portfolio.tapQuickActionReceiveButton();
    await app.receive.selectReceiveFundsOption(ReceiveFundsOptions.CRYPTO);

    await app.modularDrawer.selectCurrencyByTicker(Account.ETH_1.currency.ticker);
    await app.modularDrawer.selectNetwork(Currency.OP.name);
    await app.modularDrawer.validateNumberOfAccounts(2);
  });

  $TmsLink("B2CQA-650");
  it("Should access to receive after importing a cryptocurrency on a selected network", async () => {
    await app.modularDrawer.performSearchByTicker(Currency.POL.ticker);
    await app.modularDrawer.selectCurrencyByTicker(Currency.POL.ticker);
    await app.modularDrawer.selectNetwork(Currency.POL.name);
    await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();

    await app.addAccount.addAccountAtIndex(Account.POL_1.accountName, Currency.POL.id, 0);

    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed(Currency.POL.ticker, Account.POL_1.accountName);
  });

  $TmsLink("B2CQA-1859");
  it("Should access to receive after selecting an existing account", async () => {
    await app.modularDrawer.selectCurrencyByTicker(Currency.XRP.ticker);
    await app.modularDrawer.selectAccount(Account.XRP_2.accountName);
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed(Currency.XRP.ticker, Account.XRP_2.accountName);
  });
});
