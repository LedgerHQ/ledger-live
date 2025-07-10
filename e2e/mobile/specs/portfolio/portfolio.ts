import { CurrencyType } from "@ledgerhq/live-common/e2e/enum/Currency";

export function runPortfolioTransactionsHistoryTest(currency: CurrencyType, tmsLinks: string[]) {
  describe("Portfolio transaction history", () => {
    beforeAll(async () => {
      await app.init({
        userdata: "speculos-tests-app",
        speculosApp: currency.speculosApp,
      });
      await app.portfolio.waitForPortfolioPageToLoad();
    });

    tmsLinks.forEach(link => $TmsLink(link));
    it("Transaction history displayed when user added his accounts - LLM", async () => {
      await app.portfolio.openViaDeeplink();
      await app.portfolio.checkTransactionAllocationSection();
      await app.portfolio.selectAndClickOnLastOperation();
      await app.operationDetails.checkTransactionDetailsVisibility();
    });
  });
}

export function runPortfolioChartsAndAssetsTest(tmsLinks: string[]) {
  describe("Portfolio charts and assets", () => {
    beforeAll(async () => {
      await app.init({
        userdata: "speculos-tests-app",
      });
      await app.portfolio.waitForPortfolioPageToLoad();
    });

    tmsLinks.forEach(link => $TmsLink(link));
    it("Charts and assets section are displayed when user added his accounts - LLM", async () => {
      await app.portfolio.openViaDeeplink();
      await app.portfolio.checkQuickActionButtonsVisibility();
      await app.portfolio.checkChartVisibility();
      await app.portfolio.checkAssetAllocationSection();
    });
  });
}
