import { device } from "detox";

// TODO(LIVE-33334): these legacy mock specs will be removed in a follow-up task;
// skipped for now.
describe.skip("Onboarding - Read Only", () => {
  $TmsLink("B2CQA-370");
  $TmsLink("B2CQA-1753");
  $TmsLink("B2CQA-1806");
  it("goes through discover app and should see an empty portfolio page", async () => {
    await device.reloadReactNative();
    await app.onboarding.startOnboarding();
    await app.onboarding.chooseNoLedgerYet();
    await app.onboarding.chooseToExploreApp();
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.portfolio.expectPortfolioReadOnly();
  });

  $TmsLink("B2CQA-364");
  // Skipped: the standalone Market screen pins its search header under a
  // transparent nav header, so detox's strict tap on "search-box" fails in this
  // legacy mock suite. Market search is covered by e2e/mobile (wallet 4.0).
  // We'll revisit this if needed — it's likely to be replaced by the
  // non-mocked smoke tests.
  it.skip("buy a nano from the market page", async () => {
    await app.portfolio.expectPortfolioReadOnly();
    await app.market.openViaDeeplink();
    await app.market.searchAsset("BTC");
    await app.market.openAssetPage("BTC");
    await app.market.buyAsset();
    /*  Todo: Fix webview check tests
        await app.buyDevice.buyNano();
        await app.buyDevice.expectBuyNanoWebPage();
    */
  });
});
