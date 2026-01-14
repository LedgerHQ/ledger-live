const testConfig = {
  tmsLinks: ["B2CQA-2871", "B2CQA-2873", "B2CQA-3060", "B2CQA-2873"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
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
  it("Portfolio Accounts Tab - LLM", async () => {
    await app.portfolio.checkAccountsSection();
    const isModularDrawer = await app.modularDrawer.isFlowEnabled("add_account");
    if (isModularDrawer) {
      await app.modularDrawer.checkSelectAssetPage();
    } else {
      await app.portfolio.checkSelectAssetPage();
    }
  });
});
