import { AppPage } from "./abstractClasses";
import { step } from "../misc/reporters/step";
import { expect } from "@playwright/test";

export class MarketBannerPage extends AppPage {
  private marketBannerHeader = this.page.getByTestId("market-banner-button");
  private trendingAssetsList = this.page.getByTestId("trending-assets-list");
  private fearAndGreedCard = this.page.getByTestId("fear-and-greed-card");
  private viewAllTile = this.page.getByTestId("market-banner-view-all");
  private assetTile = (assetId: string) => this.page.getByTestId(`market-banner-asset-${assetId}`);

  @step("Expect Market Banner to be visible")
  async expectMarketBannerToBeVisible() {
    await expect(this.marketBannerHeader).toBeVisible();
  }

  @step("Expect trending assets list to be visible")
  async expectTrendingAssetsListToBeVisible() {
    await expect(this.trendingAssetsList).toBeVisible();
  }

  @step("Expect Fear and Greed card to be visible")
  async expectFearAndGreedCardToBeVisible() {
    await expect(this.fearAndGreedCard).toBeVisible();
  }

  @step("Click on Fear and Greed card")
  async clickFearAndGreedCard() {
    await this.fearAndGreedCard.click();
  }

  @step("Click on Explore Market header to navigate to Market page")
  async clickExploreMarketHeader() {
    await this.marketBannerHeader.click();
  }

  @step("Scroll to View All tile and click")
  async scrollToAndClickViewAllTile() {
    await this.viewAllTile.scrollIntoViewIfNeeded();
    await expect(this.viewAllTile).toBeVisible();
    await this.viewAllTile.click();
  }

  @step("Click on asset tile $0")
  async clickAssetTile(assetId: string) {
    await this.assetTile(assetId).click();
  }

  @step("Get first asset tile")
  async getFirstAssetTile() {
    const firstAsset = this.page.locator("[data-testid^='market-banner-asset-']").first();
    await expect(firstAsset).toBeVisible();
    return firstAsset;
  }

  @step("Click on first asset tile and return its ID")
  async clickFirstAssetTile(): Promise<string> {
    const firstAsset = await this.getFirstAssetTile();
    const testId = await firstAsset.getAttribute("data-testid");
    const assetId = testId?.replace("market-banner-asset-", "") ?? "";
    await firstAsset.click();
    return assetId;
  }
}
