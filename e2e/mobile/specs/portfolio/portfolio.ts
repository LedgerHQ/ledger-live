import { ApplicationOptions } from "page";
import { isWallet40 } from "../../helpers/commonHelpers";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

async function beforeAllFunction(options: ApplicationOptions) {
  await app.init({
    userdata: options.userdata,
    speculosApp: options.speculosApp,
    cliCommands: options.cliCommands,
  });
  await app.portfolio.waitForPortfolioPageToLoad();
}
export function runPortfolioTransactionsHistoryTest(
  account: Account,
  tmsLinks: string[],
  tags: string[],
  operationRowAccountName?: string,
) {
  describe("Portfolio transaction history", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        cliCommands: [
          async (userdataPath?: string) => {
            await CLI.liveData({
              currency: account.currency.id,
              index: account.index,
              appjson: userdataPath,
              add: true,
            });
          },
        ],
      });
    });

    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));
    it(`[${account.currency.ticker}] Transaction history displayed when user added his accounts`, async () => {
      await app.portfolio.checkTransactionHistorySection();
      await app.portfolio.selectAndClickOnLastOperation("Sent", operationRowAccountName);
      await app.operationDetails.checkTransactionDetailsVisibility(account.accountName);
    });
  });
}

export function runPortfolioChartsAndAssetsTest(tmsLinks: string[], tags: string[]) {
  (isWallet40 ? describe.skip : describe)("Portfolio charts and assets", () => {
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
