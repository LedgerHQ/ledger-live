import { device } from "detox";

describe("Onboarding - Read Only", () => {
  it("is able to buy a nano from the onboarding flow", async () => {
    await app.onboarding.startOnboarding();
    await app.onboarding.chooseNoLedgerYet();
    await app.onboarding.chooseToBuyLedger();
    /*  Todo: Fix webview check tests
        await app.buyDevice.buyNano();
        await app.buyDevice.expectBuyNanoWebPage();
    */
  });

  it("goes through discover app and should see an empty portfolio page", async () => {
    await device.launchApp({ newInstance: true });
    await app.onboarding.startOnboarding();
    await app.onboarding.chooseNoLedgerYet();
    await app.onboarding.chooseToExploreApp();
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.portfolio.expectPortfolioReadOnly();
  });

  it("buy a nano from the market page", async () => {
    await app.portfolio.expectPortfolioReadOnly();
    await app.walletTabNavigator.navigateToMarket();
    await app.market.searchAsset("BTC");
    await app.market.openAssetPage("BTC");
    await app.market.buyAsset();
    /*  Todo: Fix webview check tests
        await app.buyDevice.buyNano();
        await app.buyDevice.expectBuyNanoWebPage();
    */
  });
});
