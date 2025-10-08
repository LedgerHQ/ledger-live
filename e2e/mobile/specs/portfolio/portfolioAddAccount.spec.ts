const testConfig = {
  tmsLinks: ["B2CQA-2874"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
};

describe("Wallet Page", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "speculos-tests-app",
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  testConfig.tmsLinks.forEach(link => $TmsLink(link));
  testConfig.tags.forEach(tag => $Tag(tag));
  it("Portfolio Add Account - LLM", async () => {
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
});
