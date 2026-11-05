import { ApplicationOptions } from "@e2e/page/index";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";

async function beforeAllFunction(options: ApplicationOptions) {
  await app.init({
    userdata: options.userdata,
    speculosApp: options.speculosApp,
    cliCommands: options.cliCommands,
    speculosForSetupOnly: true,
  });
  await app.mainNavigation.waitForWallet40Ready();
}

export function runPortfolioChartsAndAssetsTest(tmsLinks: string[], tags: string[]) {
  describe("Portfolio", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "speculos-tests-app",
      });
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));
    it("Charts and assets section are displayed after adding accounts", async () => {
      await app.mainNavigation.openPortfolioViaDeeplink();
      await app.portfolio.checkQuickActionButtonsVisibility();
      await app.portfolio.checkAssetAllocationSection();
    });
  });
}
