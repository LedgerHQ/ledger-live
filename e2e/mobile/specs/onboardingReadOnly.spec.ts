describe("Onboarding - Read Only", () => {
  $TmsLink("B2CQA-370");
  $TmsLink("B2CQA-1753");
  $TmsLink("B2CQA-1806");
  it("goes through discover app and should see an empty portfolio page", async () => {
    await app.onboarding.startOnboarding();
    await app.onboarding.chooseNoLedgerYet();
    await app.onboarding.chooseToExploreApp();
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.portfolio.expectPortfolioReadOnly();
  });
});
