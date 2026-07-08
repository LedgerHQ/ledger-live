import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";
import { getMergedFeatureFlags } from "../../utils/featureFlagUtils";
import type { Features } from "@shared/feature-flags";
const tags = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];
const isQ2 =
  (getMergedFeatureFlags().lwmWallet40 as Features["lwmWallet40"] | undefined)?.params
    ?.aggregatedAssets === true;

setTeamOwner(Team.WALLET_XP);
// In Q2 the tab layout (Assets/Accounts tabs) no longer exists — skip the whole suite
(isQ2 ? describe.skip : describe)("Wallet Page", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "speculos-tests-app",
    });
    await app.mainNavigation.waitForWallet40Ready();
  });

  ["B2CQA-2869", "B2CQA-2870"].forEach(link => $TmsLink(link));
  tags.forEach(tag => $Tag(tag));
  it("Portfolio Assets Tab - LLM", async () => {
    await app.portfolio.checkAssetAllocationSection();
  });

  ["B2CQA-2874"].forEach(link => $TmsLink(link));
  tags.forEach(tag => $Tag(tag));
  it("Portfolio Add Account - LLM", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.portfolio.tapTabSelector("Accounts");
    await app.portfolio.tapAddNewOrExistingAccountButton();
    await app.addAccount.importWithYourLedger();
    await app.modularDrawer.checkSelectAssetPage();
    await app.modularDrawer.tapDrawerCloseButton();
    await app.portfolio.expectPortfolioWithAccounts();
  });

  ["B2CQA-2871", "B2CQA-2873", "B2CQA-3060"].forEach(link => $TmsLink(link));
  tags.forEach(tag => $Tag(tag));
  it("Portfolio Accounts Tab - LLM", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.portfolio.checkAccountsSection();
    await app.modularDrawer.checkSelectAssetPage();
  });
});
