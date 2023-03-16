import { expect } from "@playwright/test";
import test from "../../fixtures/common";
import { MarketPage } from "../../models/MarketPage";
import { Layout } from "../../models/Layout";
import { MarketCoinPage } from "../../models/MarketCoinPage";

test.use({ userdata: "skip-onboarding" });

test("Market", async ({ page }) => {
  const marketPage = new MarketPage(page);
  const marketCoinPage = new MarketCoinPage(page);
  const layout = new Layout(page);

  await test.step("go to market", async () => {
    await layout.goToMarket();
    await marketPage.waitForLoading();
    await expect.soft(page).toHaveScreenshot("market-page-no-scrollbar.png");
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

  await test.step("buy bitcoin from market page", async () => {
    await marketPage.openBuyPage("btc");
    await expect.soft(page).toHaveScreenshot("market-btc-buy-page.png");
    await layout.goToMarket();
  });

  await test.step("go to bitcoin page", async () => {
    await marketPage.openCoinPage("btc");
    await expect.soft(page).toHaveScreenshot("market-btc-page.png");
  });

  await test.step("buy bitcoin from coin page", async () => {
    await marketCoinPage.openBuyPage();
    await expect.soft(page).toHaveScreenshot("market-btc-buy-page.png");
  });
});
