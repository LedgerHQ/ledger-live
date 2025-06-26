import { CurrencyType } from "@ledgerhq/live-common/e2e/enum/Currency";
import { ApplicationOptions } from "page";

async function beforeAllFunction(options: ApplicationOptions) {
  await app.init({
    userdata: options.userdata,
    speculosApp: options.speculosApp,
  });
  await app.portfolio.waitForPortfolioPageToLoad();
}
export function runPortfolioTransactionsHistoryTest(currency: CurrencyType, tmsLinks: string[]) {
  describe("Portfolio transaction history", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "speculos-tests-app",
        speculosApp: currency.speculosApp,
      });
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
      await beforeAllFunction({
        userdata: "speculos-tests-app",
      });
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

export function runWalletPageTest(
  tmsLinks: string[],
  tags: string[],
  event: "Accounts Tab" | "Assets Tab" | "Add Account",
) {
  describe("Wallet Page", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "speculos-tests-app",
      });
    });

    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));
    it(`${event} - LLM`, async () => {
      switch (event) {
        case "Accounts Tab":
          await app.portfolio.checkAccountsSection();
          break;
        case "Assets Tab":
          await app.portfolio.checkAssetAllocationSection();
          break;
        case "Add Account":
          await app.portfolio.tapTabSelector("Accounts");
          await app.addAccount.tapAddNewOrExistingAccountButton();
          await app.addAccount.importWithYourLedger();
          await app.portfolio.checkSelectAssetPage();
          await app.common.goToPreviousPage();
          await app.portfolio.expectPortfolioWithAccounts();
          break;
      }
    });
  });
}
