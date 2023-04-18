import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import * as server from "../../utils/serve-dummy-app";
import { Layout } from "../../models/Layout";
import { DiscoverPage } from "../../models/DiscoverPage";
import { PortfolioPage } from "../../models/PortfolioPage";
import { AssetPage } from "../../models/AssetPage";
import { AccountsPage } from "../../models/AccountsPage";
import { AccountPage } from "../../models/AccountPage";
import { SettingsPage } from "../../models/SettingsPage";
import { MarketPage } from "../../models/MarketPage";

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

let continueTest = false;

test.beforeAll(async ({ request }) => {
  // Check that dummy app in tests/utils/dummy-ptx-app has been started successfully
  try {
    const port = await server.start("dummy-ptx-app/public");
    const response = await request.get(`http://localhost:${port}`);
    if (response.ok() && port) {
      continueTest = true;
      console.info(`========> Dummy test app successfully running on port ${port}! <=========`);
      process.env.MOCK_REMOTE_LIVE_MANIFEST = JSON.stringify(server.dummyLiveAppManifest(port));
    } else {
      throw new Error("Ping response != 200, got: " + response.status);
    }
  } catch (error) {
    console.warn(`========> Dummy test app not running! <=========`);
    console.error(error);
  }
});

test.afterAll(() => {
  server.stop();
  console.info(`========> Dummy test app stopped <=========`);
  delete process.env.MOCK_REMOTE_LIVE_MANIFEST;
});

test("Buy / Sell", async ({ page }) => {
  // Don't run test if server is not running
  if (!continueTest) return;

  const layout = new Layout(page);
  const liveApp = new DiscoverPage(page);
  const portfolioPage = new PortfolioPage(page);
  const assetPage = new AssetPage(page);
  const accountPage = new AccountPage(page);
  const accountsPage = new AccountsPage(page);
  const settingsPage = new SettingsPage(page);
  const marketPage = new MarketPage(page);

  await test.step("Navigate to Buy app from portfolio banner", async () => {
    await portfolioPage.startBuyFlow();
    await expect(await liveApp.waitForCorrectTextInWebview("theme: dark")).toBe(true);
    await expect(await liveApp.waitForCorrectTextInWebview("lang: en")).toBe(true);
    await expect.soft(page).toHaveScreenshot("buy-app-opened.png");
  });

  await test.step("Navigate to Buy app from market", async () => {
    await layout.goToMarket();
    await marketPage.openBuyPage("usdt");
    await expect(await liveApp.waitForCorrectTextInWebview("theme: dark")).toBe(true);
    await expect(
      await liveApp.waitForCorrectTextInWebview("currency: ethereum/erc20/usd_tether__erc20_"),
    ).toBe(true);
    await expect(await liveApp.waitForCorrectTextInWebview("mode: buy")).toBe(true);
    await expect(await liveApp.waitForCorrectTextInWebview("lang: en")).toBe(true);
  });

  await test.step("Navigate to Buy app from asset", async () => {
    await layout.goToPortfolio();
    await portfolioPage.navigateToAsset("ethereum");
    await assetPage.startBuyFlow();

    await expect(await liveApp.waitForCorrectTextInWebview("theme: dark")).toBe(true);
    await expect(await liveApp.waitForCorrectTextInWebview("lang: en")).toBe(true);
    await expect(await liveApp.waitForCorrectTextInWebview("currency: ethereum")).toBe(true);
    await expect(await liveApp.waitForCorrectTextInWebview("mode: buy")).toBe(true);
  });

  await test.step("Navigate to Buy app from account", async () => {
    await layout.goToAccounts();
    await accountsPage.navigateToAccountByName("Bitcoin 1 (legacy)");
    await accountPage.navigateToBuy();

    await expect(await liveApp.waitForCorrectTextInWebview("theme: dark")).toBe(true);
    await expect(await liveApp.waitForCorrectTextInWebview("currency: bitcoin")).toBe(true);
    await expect(
      await liveApp.waitForCorrectTextInWebview("account: mock:1:bitcoin:true_bitcoin_0:"),
    ).toBe(true);
    await expect(await liveApp.waitForCorrectTextInWebview("lang: en")).toBe(true);
    await expect(await liveApp.waitForCorrectTextInWebview("mode: buy")).toBe(true);
  });

  await test.step("Navigate to Buy app from account", async () => {
    await layout.goToAccounts();
    await accountsPage.navigateToAccountByName("Bitcoin 1 (legacy)");
    await accountPage.navigateToSell();

    await expect(await liveApp.waitForCorrectTextInWebview("theme: dark")).toBe(true);
    await expect(await liveApp.waitForCorrectTextInWebview("currency: bitcoin")).toBe(true);
    await expect(
      await liveApp.waitForCorrectTextInWebview("account: mock:1:bitcoin:true_bitcoin_0:"),
    ).toBe(true);
    await expect(await liveApp.waitForCorrectTextInWebview("lang: en")).toBe(true);
    await expect(await liveApp.waitForCorrectTextInWebview("mode: sell")).toBe(true);
  });

  await test.step(
    "Navigate to Buy app from sidebar with light theme and French Language",
    async () => {
      await layout.goToSettings();
      await settingsPage.changeLanguage("English", "Français");
      await settingsPage.changeTheme();
      await await layout.goToBuyCrypto();

      await expect(await liveApp.waitForCorrectTextInWebview("theme: light")).toBe(true);
      await expect(await liveApp.waitForCorrectTextInWebview("lang: fr")).toBe(true);
    },
  );
});
