import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../component/layout.component";
import { PortfolioPage } from "../../page/portfolio.page";
import { AssetPage } from "../../page/asset.page";
import { AccountsPage } from "../../page/accounts.page";
import { AccountPage } from "../../page/account.page";
import { SettingsPage } from "../../page/settings.page";
import { MarketPage } from "../../page/market.page";
import { LiveAppWebview } from "../../models/LiveAppWebview";
import { BUY_SELL_UI_APP_ID } from "@ledgerhq/live-common/wallet-api/constants";

test.use({
  userdata: "1AccountBTC1AccountETH",
  featureFlags: {
    portfolioExchangeBanner: { enabled: true },
  },
});

let testServerIsRunning = false;

test.beforeAll(async () => {
  // Check that dummy app in tests/dummy-ptx-app has been started successfully
  testServerIsRunning = await LiveAppWebview.startLiveApp("dummy-ptx-app/public", {
    name: "Buy App",
    id: BUY_SELL_UI_APP_ID,
    permissions: ["account.request"],
  });

  if (!testServerIsRunning) {
    console.warn("Stopping Buy/Sell test setup");
    return;
  }
});

test.afterAll(async () => {
  if (testServerIsRunning) {
    await LiveAppWebview.stopLiveApp();
  }
});

test("Buy / Sell @smoke", async ({ page, electronApp }) => {
  if (!testServerIsRunning) {
    console.warn("Test server not running - Cancelling Buy/Sell E2E test");
    return;
  }

  const layout = new Layout(page);
  const portfolioPage = new PortfolioPage(page);
  const liveAppWebview = new LiveAppWebview(page, electronApp);
  const assetPage = new AssetPage(page);
  const accountPage = new AccountPage(page);
  const accountsPage = new AccountsPage(page);
  const settingsPage = new SettingsPage(page);
  const marketPage = new MarketPage(page);

  await test.step("Navigate to Buy app from portfolio banner", async () => {
    await portfolioPage.startBuyFlow();
    await liveAppWebview.waitForLoaded();
    await liveAppWebview.waitForText("theme: dark");
    await liveAppWebview.waitForText("lang: en");
    await liveAppWebview.waitForText("locale: en-US");
    await liveAppWebview.waitForText("currencyTicker: USD");
    await expect
      .soft(page)
      .toHaveScreenshot("buy-app-opened.png", { mask: [page.locator("webview")] });
  });

  await test.step("Navigate to Buy app from market", async () => {
    await layout.goToMarket();
    await marketPage.openBuyPage("usdt");
    await liveAppWebview.waitForText("theme: dark");
    await liveAppWebview.waitForText("currency: ethereum/erc20/usd_tether__erc20_");
    await liveAppWebview.waitForText("mode: buy");
    await liveAppWebview.waitForText("lang: en");
    await liveAppWebview.waitForText("locale: en-US");
    await liveAppWebview.waitForText("currencyTicker: USD");
  });

  await test.step("Navigate to Buy app from asset", async () => {
    await layout.goToPortfolio();
    await portfolioPage.navigateToAsset("ethereum");
    await assetPage.startBuyFlow();
    await liveAppWebview.waitForText("theme: dark");
    await liveAppWebview.waitForText("lang: en");
    await liveAppWebview.waitForText("locale: en-US");
    await liveAppWebview.waitForText("currencyTicker: USD");
    await liveAppWebview.waitForText("currency: ethereum");
    await liveAppWebview.waitForText("mode: buy");
  });

  await test.step("Navigate to Buy app from account", async () => {
    await layout.goToAccounts();
    await accountsPage.navigateToAccountByName("Bitcoin 1 (legacy)");
    await accountPage.navigateToBuy();
    await liveAppWebview.waitForText("theme: dark");
    await liveAppWebview.waitForText("currency: bitcoin");
    await liveAppWebview.waitForText("account: mock:1:bitcoin:true_bitcoin_0:");
    await liveAppWebview.waitForText("lang: en");
    await liveAppWebview.waitForText("locale: en-US");
    await liveAppWebview.waitForText("currencyTicker: USD");
    await liveAppWebview.waitForText("mode: buy");
  });

  await test.step("Navigate to Buy app from account", async () => {
    await layout.goToAccounts();
    await accountsPage.navigateToAccountByName("Bitcoin 1 (legacy)");
    await accountPage.navigateToSell();
    await liveAppWebview.waitForText("theme: dark");
    await liveAppWebview.waitForText("currency: bitcoin");
    await liveAppWebview.waitForText("account: mock:1:bitcoin:true_bitcoin_0:");
    await liveAppWebview.waitForText("lang: en");
    await liveAppWebview.waitForText("locale: en-US");
    await liveAppWebview.waitForText("currencyTicker: USD");
    await liveAppWebview.waitForText("mode: sell");
  });

  await test.step("Navigate to Buy app from sidebar with light theme and French Language", async () => {
    await layout.goToSettings();
    await settingsPage.changeLanguage("English", "Français");
    await settingsPage.changeTheme();
    await layout.goToBuySellCrypto();
    await liveAppWebview.waitForText("theme: light");
    await liveAppWebview.waitForText("lang: fr");
    await liveAppWebview.waitForText("locale: en-US");
    await liveAppWebview.waitForText("currencyTicker: USD");
  });
});
