import { ApplicationOptions } from "page";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";

async function beforeAllFunction(options: ApplicationOptions) {
  await app.init({
    userdata: options.userdata,
    speculosApp: options.speculosApp,
    cliCommands: options.cliCommands,
  });
  await app.mainNavigation.waitForWallet40Ready();
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
        cliCommands: [liveDataCommand(account)],
      });
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));
    it(`[${account.currency.ticker}] Transaction history displayed when user added his accounts`, async () => {
      await app.portfolio.checkTransactionHistorySection();
      await app.portfolio.selectAndClickOnLastOperation(/(Fees|Sent).*/i, operationRowAccountName);
      await app.operationDetails.checkTransactionDetailsVisibility(account.accountName);
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

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));
    it("Charts and assets section are displayed when user added his accounts", async () => {
      await app.mainNavigation.openPortfolioViaDeeplink();
      await app.portfolio.checkQuickActionButtonsVisibility();
      await app.portfolio.checkAssetAllocationSection();
    });
  });
}
