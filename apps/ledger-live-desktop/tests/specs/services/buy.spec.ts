import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { PortfolioPage } from "../../models/PortfolioPage";
import { AssetPage } from "../../models/AssetPage";
import { AccountsPage } from "../../models/AccountsPage";
import { AccountPage } from "../../models/AccountPage";
import { SettingsPage } from "../../models/SettingsPage";
import { MarketPage } from "../../models/MarketPage";
import { LiveAppWebview } from "../../models/LiveAppWebview";

test.use({
  userdata: "1AccountBTC1AccountETH",
  featureFlags: {
    ptxSmartRouting: {
      enabled: true,
      params: { liveAppId: "multibuy" },
    },
    portfolioExchangeBanner: { enabled: true },
  },
});

let testServerIsRunning = false;

test.beforeAll(async () => {
  // Check that dummy app in libs/test-utils/dummy-ptx-app has been started successfully
  testServerIsRunning = await LiveAppWebview.startLiveApp("dummy-ptx-app/public", {
    name: "Buy App",
    id: "multibuy",
    permissions: [
      {
        method: "account.request",
        params: {
          currencies: ["ethereum", "bitcoin", "algorand"],
        },
      },
    ],
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

test("Buy / Sell @smoke", async ({ page }) => {
  if (!testServerIsRunning) {
    console.warn("Test server not running - Cancelling Buy/Sell E2E test");
    return;
  }

  const layout = new Layout(page);
  const portfolioPage = new PortfolioPage(page);
  const liveAppWebview = new LiveAppWebview(page);
  const assetPage = new AssetPage(page);
  const accountPage = new AccountPage(page);
  const accountsPage = new AccountsPage(page);
  const settingsPage = new SettingsPage(page);
  const marketPage = new MarketPage(page);

  await test.step("Navigate to Buy app from portfolio banner", async () => {
    await portfolioPage.startBuyFlow();
    await expect(await liveAppWebview.waitForCorrectTextInWebview("theme: dark")).toBe(true);
    await expect(await liveAppWebview.waitForCorrectTextInWebview("lang: en")).toBe(true);
    await expect
      .soft(page)
      .toHaveScreenshot("buy-app-opened.png", { mask: [page.locator("webview")] });
  });

  await test.step("Navigate to Buy app from market", async () => {
    await layout.goToMarket();
    await marketPage.openBuyPage("usdt");
    await expect(await liveAppWebview.waitForCorrectTextInWebview("theme: dark")).toBe(true);
    await expect(
      await liveAppWebview.waitForCorrectTextInWebview(
        "currency: ethereum/erc20/usd_tether__erc20_",
      ),
    ).toBe(true);
    await expect(await liveAppWebview.waitForCorrectTextInWebview("mode: buy")).toBe(true);
    await expect(await liveAppWebview.waitForCorrectTextInWebview("lang: en")).toBe(true);
  });

  await test.step("Navigate to Buy app from asset", async () => {
    await layout.goToPortfolio();
    await portfolioPage.navigateToAsset("ethereum");
    await assetPage.startBuyFlow();

    await expect(await liveAppWebview.waitForCorrectTextInWebview("theme: dark")).toBe(true);
    await expect(await liveAppWebview.waitForCorrectTextInWebview("lang: en")).toBe(true);
    await expect(await liveAppWebview.waitForCorrectTextInWebview("currency: ethereum")).toBe(true);
    await expect(await liveAppWebview.waitForCorrectTextInWebview("mode: buy")).toBe(true);
  });

  await test.step("Navigate to Buy app from account", async () => {
    await layout.goToAccounts();
    await accountsPage.navigateToAccountByName("Bitcoin 1 (legacy)");
    await accountPage.navigateToBuy();

    await expect(await liveAppWebview.waitForCorrectTextInWebview("theme: dark")).toBe(true);
    await expect(await liveAppWebview.waitForCorrectTextInWebview("currency: bitcoin")).toBe(true);
    await expect(
      await liveAppWebview.waitForCorrectTextInWebview("account: mock:1:bitcoin:true_bitcoin_0:"),
    ).toBe(true);
    await expect(await liveAppWebview.waitForCorrectTextInWebview("lang: en")).toBe(true);
    await expect(await liveAppWebview.waitForCorrectTextInWebview("mode: buy")).toBe(true);
  });

  await test.step("Navigate to Buy app from account", async () => {
    await layout.goToAccounts();
    await accountsPage.navigateToAccountByName("Bitcoin 1 (legacy)");
    await accountPage.navigateToSell();

    await expect(await liveAppWebview.waitForCorrectTextInWebview("theme: dark")).toBe(true);
    await expect(await liveAppWebview.waitForCorrectTextInWebview("currency: bitcoin")).toBe(true);
    await expect(
      await liveAppWebview.waitForCorrectTextInWebview("account: mock:1:bitcoin:true_bitcoin_0:"),
    ).toBe(true);
    await expect(await liveAppWebview.waitForCorrectTextInWebview("lang: en")).toBe(true);
    await expect(await liveAppWebview.waitForCorrectTextInWebview("mode: sell")).toBe(true);
  });

  await test.step("Navigate to Buy app from sidebar with light theme and French Language", async () => {
    await layout.goToSettings();
    await settingsPage.changeLanguage("English", "Français");
    await settingsPage.changeTheme();
    await await layout.goToBuyCrypto();

    await expect(await liveAppWebview.waitForCorrectTextInWebview("theme: light")).toBe(true);
    await expect(await liveAppWebview.waitForCorrectTextInWebview("lang: fr")).toBe(true);
  });
});
