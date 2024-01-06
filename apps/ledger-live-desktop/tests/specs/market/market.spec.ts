import { expect } from "@playwright/test";
import { getEnv } from "@ledgerhq/live-env";
import test from "../../fixtures/common";
import { MarketPage } from "../../models/MarketPage";
import { Layout } from "../../models/Layout";
import { MarketCoinPage } from "../../models/MarketCoinPage";
import { LiveAppWebview } from "../../models/LiveAppWebview";

test.use({ userdata: "skip-onboarding" });

let testServerIsRunning = false;

test.beforeAll(async () => {
  // Check that dummy app in tests/dummy-ptx-app has been started successfully
  testServerIsRunning = await LiveAppWebview.startLiveApp("dummy-ptx-app/public", {
    name: "Buy App",
    id: "multibuy-v2",
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

test("Market", async ({ page }) => {
  const marketPage = new MarketPage(page);
  const marketCoinPage = new MarketCoinPage(page);
  const layout = new Layout(page);
  const liveAppWebview = new LiveAppWebview(page);

  await test.step("go to market", async () => {
    await layout.goToMarket();
    await marketPage.waitForLoading();
    await expect.soft(page).toHaveScreenshot("market-page-no-scrollbar.png");
  });

  await page.route(`${getEnv("LEDGER_COUNTERVALUES_API")}/v2/supported-to`, async route => {
    route.fulfill({
      headers: { teststatus: "mocked" },
      body: JSON.stringify([
        "aed",
        "ars",
        "aud",
        "bch",
        "bdt",
        "bhd",
        "bits",
        "bmd",
        "bnb",
        "brl",
        "btc",
        "cad",
        "chf",
        "clp",
        "cny",
        "czk",
        "dkk",
        "dot",
        "eos",
        "eth",
        "eur",
        "gbp",
        "hkd",
        "huf",
        "idr",
        "ils",
        "inr",
        "jpy",
        "krw",
        "kwd",
        "link",
        "lkr",
        "ltc",
        "mmk",
        "mxn",
        "myr",
        "ngn",
        "nok",
        "nzd",
        "php",
        "pkr",
        "pln",
        "rub",
        "sar",
        "sats",
        "sek",
        "sgd",
        "thb",
        "try",
        "twd",
        "uah",
        "usd",
        "vef",
        "vnd",
        "xag",
        "xau",
        "xdr",
        "xlm",
        "xrp",
        "yfi",
        "zar",
      ]),
    });
  });

  await test.step("change countervalue", async () => {
    await marketPage.switchCountervalue("THB");
    await marketPage.waitForLoading();
    await expect.soft(page).toHaveScreenshot("market-page-thb-countervalue.png");
  });

  await test.step("change market range", async () => {
    await marketPage.switchMarketRange("7d");
    await marketPage.waitForLoading();
    await expect.soft(page).toHaveScreenshot("market-page-7d-range.png");
  });

  await test.step("star bitcoin", async () => {
    await marketPage.starCoin("btc");
    await expect.soft(page).toHaveScreenshot("market-page-btc-star.png");
  });

  await test.step("search bi", async () => {
    await marketPage.search("bi");
    await marketPage.waitForLoading();
    await expect.soft(page).toHaveScreenshot("market-page-search-bi.png");
  });

  await test.step("filter starred", async () => {
    await marketPage.toggleStarFilter();
    await marketPage.waitForLoading();
    await marketPage.waitForSearchBarToBeEmpty(); // windows was showing the search bar still containing text. This wait prevents that
    await expect.soft(page).toHaveScreenshot("market-page-filter-starred.png");
  });

  await test.step("swap available to bitcoin", async () => {
    await marketPage.swapButton("btc").isVisible();
  });

  await test.step("buy bitcoin from market page", async () => {
    await marketPage.openBuyPage("btc");
    await expect
      .soft(page)
      .toHaveScreenshot("market-btc-buy-page.png", { mask: [page.locator("webview")] });
    await expect(await liveAppWebview.waitForCorrectTextInWebview("theme: dark")).toBe(true);
    await expect(await liveAppWebview.waitForCorrectTextInWebview("currency: bitcoin")).toBe(true);
    await expect(await liveAppWebview.waitForCorrectTextInWebview("mode: buy")).toBe(true);
    await expect(await liveAppWebview.waitForCorrectTextInWebview("lang: en")).toBe(true);

    await layout.goToMarket();
  });

  await test.step("go to bitcoin page", async () => {
    await marketPage.openCoinPage("btc");
    await expect.soft(page).toHaveScreenshot("market-btc-page.png");
  });

  await test.step("buy bitcoin from coin page", async () => {
    await marketCoinPage.openBuyPage();
    await expect
      .soft(page)
      .toHaveScreenshot("market-btc-buy-page.png", { mask: [page.locator("webview")] });
    await expect(await liveAppWebview.waitForCorrectTextInWebview("theme: dark")).toBe(true);
    await expect(await liveAppWebview.waitForCorrectTextInWebview("currency: bitcoin")).toBe(true);
    await expect(await liveAppWebview.waitForCorrectTextInWebview("mode: buy")).toBe(true);
    await expect(await liveAppWebview.waitForCorrectTextInWebview("lang: en")).toBe(true);
  });
});
