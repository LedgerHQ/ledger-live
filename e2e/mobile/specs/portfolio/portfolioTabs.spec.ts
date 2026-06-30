import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";

const tags = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];

setTeamOwner(Team.WALLET_XP);
describe("Wallet Page", () => {
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
    const isModularDrawer = await app.modularDrawer.isFlowEnabled("add_account");
    if (isModularDrawer) {
      await app.modularDrawer.checkSelectAssetPage();
      await app.modularDrawer.tapDrawerCloseButton();
    } else {
      await app.portfolio.checkSelectAssetPage();
      await app.common.goToPreviousPage();
    }
    await app.portfolio.expectPortfolioWithAccounts();
  });

  ["B2CQA-2871", "B2CQA-2873", "B2CQA-3060"].forEach(link => $TmsLink(link));
  tags.forEach(tag => $Tag(tag));
  it("Portfolio Accounts Tab - LLM", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.portfolio.checkAccountsSection();
    const isModularDrawer = await app.modularDrawer.isFlowEnabled("add_account");
    if (isModularDrawer) {
      await app.modularDrawer.checkSelectAssetPage();
    } else {
      await app.portfolio.checkSelectAssetPage();
    }
  });
});
