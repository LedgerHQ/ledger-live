const testConfig = {
  tmsLinks: ["B2CQA-4345", "B2CQA-4339", "B2CQA-4346", "B2CQA-4343", "B2CQA-4341", "B2CQA-4340"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

const ACCOUNT = Account.INJ_1;
const CURRENCY = ACCOUNT.currency;
const TICKER = CURRENCY.ticker;

describe("Wallet 4.0 - Portfolio", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding",
      speculosApp: CURRENCY.speculosApp,
      // to-do remove when wallet 4.0 is default
      featureFlags: {
        lwmWallet40: {
          enabled: true,
          params: { marketBanner: true, graphRework: true, quickActionCtas: true },
        },
        llmAccountListUI: {
          enabled: true,
        },
      },
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  testConfig.tmsLinks.forEach(link => $TmsLink(link));
  testConfig.tags.forEach(tag => $Tag(tag));

  it("checks the quick action buttons visibility", async () => {
    await app.portfolio.checkQuickActionTransferButtonVisibility();
    await app.portfolio.checkQuickActionSwapButtonVisibility();
    await app.portfolio.checkQuickActionBuyButtonVisibility();
    // check that the quick action swap button is disabled by pressing it and checking the no balance title visibility
    await app.portfolio.pressQuickActionSwapButton();
    await app.portfolio.checkNoBalanceTitleVisibility();
  });

  it("adds an account and change the app state", async () => {
    await app.portfolio.addAccount();
    await app.addAccount.importWithYourLedger();
    await app.modularDrawer.performSearchByTicker(TICKER);
    await app.modularDrawer.selectCurrencyByTicker(TICKER);
    await app.modularDrawer.selectNetwork(CURRENCY.name);
    await app.addAccount.addAccountAtIndex(ACCOUNT.accountName, CURRENCY.id, ACCOUNT.index);
    await app.common.tapCloseWithConfirmationButton();
  });

  it("checks the portfolio state", async () => {
    await app.portfolio.checkQuickActionTransferButtonVisibility();
    await app.portfolio.checkQuickActionSwapButtonVisibility();
    await app.portfolio.checkQuickActionBuyButtonVisibility();
    await app.portfolio.checkNormalBalanceTitleVisibility();
    await app.portfolio.checkPortfolioBalanceAnalyticsPillVisibility();
  });

  it("checks the analytics screen", async () => {
    await app.portfolio.tapPortfolioBalanceAnalyticsPill();
    await app.portfolio.expectBalanceToBeVisible();
    await app.common.goToPreviousPage();
  });

  it("checks the buy navigation", async () => {
    await app.portfolio.pressQuickActionBuyButton();
    await app.buySell.expectBuySellScreenToBeVisible("Buy");
  });

  it("checks the swap navigation", async () => {
    await app.portfolio.openViaDeeplink();
    await app.portfolio.waitForPortfolioPageToLoad();

    await app.portfolio.pressQuickActionSwapButton();
    await app.swapLiveApp.expectSwapLiveApp();
  });

  it("checks the transfer bottom sheet actions", async () => {
    await app.portfolio.openViaDeeplink();
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.portfolio.pressQuickActionTransferButton();
    await app.portfolio.checkTransferBottomSheetReceiveButtonVisibility();
    await app.portfolio.checkTransferBottomSheetSendButtonVisibility();
    if (await app.portfolio.isNoahEnabled()) {
      await app.portfolio.checkTransferBottomSheetBankTransferButtonVisibility();
    }
    await app.portfolio.pressTransferBottomSheetReceiveButton();
    await app.modularDrawer.checkSelectAssetPage();
    await app.portfolio.closeBottomSheet();

    await app.portfolio.pressQuickActionTransferButton();
    await app.portfolio.pressTransferBottomSheetSendButton();
    await app.send.expectFirstStep();
  });
});
