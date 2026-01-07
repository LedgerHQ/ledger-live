import { CurrencyType } from "@ledgerhq/live-common/e2e/enum/Currency";
import { ApplicationOptions } from "page";

async function beforeAllFunction(options: ApplicationOptions) {
  await app.init({
    userdata: options.userdata,
    speculosApp: options.speculosApp,
  });
  await app.portfolio.waitForPortfolioPageToLoad();
}
export function runPortfolioTransactionsHistoryTest(
  currency: CurrencyType,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Portfolio transaction history", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "speculos-tests-app",
        speculosApp: currency.speculosApp,
      });
    });

    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));
    it("Transaction history displayed when user added his accounts", async () => {
      await app.portfolio.openViaDeeplink();
      await app.portfolio.checkTransactionAllocationSection();
      await app.portfolio.selectAndClickOnLastOperation();
      await app.operationDetails.checkTransactionDetailsVisibility();
    });
  });
}

export function runPortfolioChartsAndAssetsTest(tmsLinks: string[], tags: string[]) {
  describe("Portfolio charts and assets", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "speculos-tests-app",
      });
    });

    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));
    it("Charts and assets section are displayed when user added his accounts", async () => {
      await app.portfolio.openViaDeeplink();
      await app.portfolio.checkQuickActionButtonsVisibility();
      await app.portfolio.checkChartVisibility();
      await app.portfolio.checkAssetAllocationSection();
    });
  });
}
