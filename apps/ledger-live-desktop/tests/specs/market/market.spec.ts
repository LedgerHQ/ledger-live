import { expect, Locator, Page } from "@playwright/test";
import { getEnv } from "@ledgerhq/live-env";
import test from "../../fixtures/common";
import { MarketPage } from "../../page/market.page";
import { Layout } from "../../component/layout.component";
import { MarketCoinPage } from "../../page/market.coin.page";
import { LiveAppWebview } from "../../models/LiveAppWebview";
import { BUY_SELL_UI_APP_ID } from "@ledgerhq/live-common/wallet-api/constants";

test.use({ userdata: "skip-onboarding" });

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

test("Market", async ({ page, electronApp }) => {
  const marketPage = new MarketPage(page);
  const marketCoinPage = new MarketCoinPage(page);
  const layout = new Layout(page);
  const liveAppWebview = new LiveAppWebview(page, electronApp);

  function createBaseMask(page: Page) {
    return [
      page.getByTestId("market-small-graph"),
      page.getByTestId("market-coin-price"),
      page.getByTestId("market-cap"),
      page.getByTestId("market-price-change"),
      // Fix for Test App (external) workflow
      page.getByRole("row").nth(6),
      page.getByRole("row").nth(7),
    ];
  }

  function createMaskExcluding(page: Page, excludedPatterns: string[]): Locator[] {
    const baseMask = createBaseMask(page);
    const exclusionRegex = new RegExp(`^(?!.*(?:${excludedPatterns.join("|")})).*$`);
    return [...baseMask, page.getByRole("row").filter({ hasText: exclusionRegex })];
  }

  // Masks
  const maskEverythingExceptBitcoinAndEthereum = {
    mask: createMaskExcluding(page, ["Bitcoin", "Ethereum"]),
  }; // Exclude all except Bitcoin and Ethereum
  const maskEverythingExceptBitcoin = { mask: createMaskExcluding(page, ["Bitcoin"]) }; // Exclude all except Bitcoin

  await test.step("go to market", async () => {
    await layout.goToMarket();
    await marketPage.waitForLoadingWithSwapbtn();
    await expect
      .soft(page)
      .toHaveScreenshot("market-page-no-scrollbar.png", maskEverythingExceptBitcoinAndEthereum);
  });

  await page.route(`${getEnv("LEDGER_COUNTERVALUES_API")}/v3/supported/fiat`, async route => {
    route.fulfill({
      headers: { teststatus: "mocked" },
      body: JSON.stringify([
        "AED",
        "ARS",
        "AUD",
        "BCH",
        "BDT",
        "BHD",
        "BITS",
        "BMD",
        "BNB",
        "BRL",
        "BTC",
        "CAD",
        "CHF",
        "CLP",
        "CNY",
        "CZK",
        "DKK",
        "DOT",
        "EOS",
        "ETH",
        "EUR",
        "GBP",
        "HKD",
        "HUF",
        "IDR",
        "ILS",
        "INR",
        "JPY",
        "KRW",
        "KWD",
        "LINK",
        "LKR",
        "LTC",
        "MMK",
        "MXN",
        "MYR",
        "NGN",
        "NOK",
        "NZD",
        "PHP",
        "PKR",
        "PLN",
        "RUB",
        "SAR",
        "SATS",
        "SEK",
        "SGD",
        "THB",
        "TRY",
        "TWD",
        "UAH",
        "USD",
        "VEF",
        "VND",
        "XAG",
        "XAU",
        "XDR",
        "XLM",
        "XRP",
        "YFI",
        "ZAR",
      ]),
    });
  });

  await test.step("change countervalue", async () => {
    await marketPage.switchCountervalue("THB");
    await marketPage.waitForLoadingWithSwapbtn();
    await expect
      .soft(page)
      .toHaveScreenshot("market-page-thb-countervalue.png", maskEverythingExceptBitcoinAndEthereum);
  });

  await test.step("change market range", async () => {
    await marketPage.switchMarketRange("1W");
    await marketPage.waitForLoadingWithSwapbtn();
    await expect
      .soft(page)
      .toHaveScreenshot("market-page-7d-range.png", maskEverythingExceptBitcoinAndEthereum);
  });

  await test.step("star bitcoin", async () => {
    await marketPage.starCoin("btc");
    await expect
      .soft(page)
      .toHaveScreenshot("market-page-btc-star.png", maskEverythingExceptBitcoinAndEthereum);
  });

  await test.step("search bitcoin", async () => {
    await marketPage.search("bitcoin");
    await marketPage.waitForLoading();
    await expect
      .soft(page)
      .toHaveScreenshot("market-page-search-bitcoin.png", maskEverythingExceptBitcoin);
  });

  await test.step("filter starred", async () => {
    await marketPage.toggleStarFilter();
    await marketPage.waitForLoadingWithSwapbtn();
    // await marketPage.waitForSearchBarToBeEmpty(); // windows was showing the search bar still containing text. This wait prevents that
    await expect
      .soft(page)
      .toHaveScreenshot("market-page-filter-starred.png", maskEverythingExceptBitcoinAndEthereum);
  });

  await test.step("swap available to bitcoin", async () => {
    await marketPage.swapButton("btc").isVisible();
  });

  await test.step("buy bitcoin from market page", async () => {
    await marketPage.openBuyPage("btc");
    await expect
      .soft(page)
      .toHaveScreenshot("market-btc-buy-page.png", { mask: [page.locator("webview")] });
    await liveAppWebview.waitForText("theme: dark");
    await liveAppWebview.waitForText("currency: bitcoin");
    await liveAppWebview.waitForText("mode: buy");
    await liveAppWebview.waitForText("lang: en");

    await layout.goToMarket();
  });

  await test.step("go to bitcoin page", async () => {
    await marketPage.openCoinPage("btc");
    await page.getByTestId("chart-container").waitFor({ state: "visible" });
    await expect.soft(page).toHaveScreenshot("market-btc-page.png", {
      mask: [
        page.getByTestId("chart-container"),
        page.getByTestId("market-price-delta"),
        page.getByTestId("market-price"),
        page.getByTestId("market-price-stats-price"),
        page.getByTestId("market-price-stats-variation"),
        page.getByTestId("market-cap"),
      ],
    });
  });

  await test.step("buy bitcoin from coin page", async () => {
    await marketCoinPage.openBuyPage();
    await expect
      .soft(page)
      .toHaveScreenshot("market-btc-buy-page.png", { mask: [page.locator("webview")] });
    await liveAppWebview.waitForText("theme: dark");
    await liveAppWebview.waitForText("currency: bitcoin");
    await liveAppWebview.waitForText("mode: buy");
    await liveAppWebview.waitForText("lang: en");
  });
});
