$TmsLink("B2CQA-927", "B2CQA-928");
describe("Portfolio", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "speculos-tests-app",
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  it("Charts are displayed when user added his accounts", async () => {
    await app.portfolio.openViaDeeplink();
    await app.portfolio.checkQuickActionButtonsVisibility();
    await app.portfolio.checkChartVisibility();
    await app.portfolio.checkAssetAllocationSection();
  });
});
