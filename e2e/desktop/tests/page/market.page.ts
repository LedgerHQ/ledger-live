import { AppPage } from "./abstractClasses";
import { step } from "../misc/reporters/step";
import { expect } from "@playwright/test";
import { isWallet40Enabled } from "tests/utils/featureFlagUtils";

export class MarketPage extends AppPage {
  private searchInput = this.page.getByTestId("market-search-input");
  private loadingPlaceholder = this.page.getByTestId("loading-placeholder");
  private coinRow = (ticker: string) => this.page.getByTestId(`market-${ticker}-row`);
  private coinPageContainer = this.page.getByTestId("market-coin-page-container");
  private swapButtonOnAsset = this.page.getByTestId("market-coin-swap-button");

  private buyButtonLegacy = (ticker: string) =>
    this.page.locator(`[data-testid="market-${ticker}-buy-button"]:visible`).first();
  private swapButtonLegacy = (ticker: string) =>
    this.page.locator(`[data-testid="market-${ticker}-swap-button"]:visible`).first();
  private stakeButtonLegacy = (ticker: string) =>
    this.page.locator(`[data-testid="market-${ticker}-stake-button"]:visible`).first();

  private buyButton = (ticker: string) => this.page.getByTestId(`market-${ticker}-buy-button-icon`);
  private swapButton = (ticker: string) =>
    this.page.getByTestId(`market-${ticker}-swap-button-icon`);
  private stakeButton = (ticker: string) =>
    this.page.getByTestId(`market-${ticker}-stake-button-icon`);

  // Filter controls - using text selector because react-select doesn't forward data-testid
  private filterDropdown = this.page.getByText("Show").first();
  private starButton = (ticker: string) => this.page.getByTestId(`market-${ticker}-star-button`);
  private starredOptionFilter = this.page.getByRole("option", { name: "Starred Assets" });

  @step("Search for $0")
  async search(query: string) {
    await this.searchInput.fill(query);
  }

  @step("Validate Market List")
  async validateMarketList() {
    await this.coinRow("btc").waitFor({ state: "visible" });
    await this.coinRow("eth").waitFor({ state: "visible" });
  }

  @step("Open coin page for $0")
  async openCoinPage(ticker: string) {
    await this.coinRow(ticker.toLowerCase()).click();
    await this.coinPageContainer.waitFor({ state: "attached" });
    await this.loadingPlaceholder.first().waitFor({ state: "detached" });
  }

  @step("Open buy page for $0")
  async openBuyPage(ticker: string) {
    const button = (await isWallet40Enabled(this.page))
      ? this.buyButton(ticker.toLowerCase())
      : this.buyButtonLegacy(ticker.toLowerCase());

    await button.click();
  }

  @step("Click on swap button for $0")
  async startSwapForSelectedTicker(ticker: string) {
    const button = (await isWallet40Enabled(this.page))
      ? this.swapButton(ticker.toLowerCase())
      : this.swapButtonLegacy(ticker.toLowerCase());

    await button.click();
  }

  @step("Click on swap button on asset")
  async clickOnSwapButtonOnAsset() {
    await this.swapButtonOnAsset.click();
  }

  @step("Click on stake button for $0")
  async stakeButtonClick(ticker: string) {
    const button = (await isWallet40Enabled(this.page))
      ? this.stakeButton(ticker.toLowerCase())
      : this.stakeButtonLegacy(ticker.toLowerCase());

    await button.click();
  }

  @step("Expect filter dropdown to be visible")
  async expectFilterDropdownToBeVisible() {
    await expect(this.filterDropdown).toBeVisible();
  }

  @step("Open filter dropdown and select Starred Assets")
  async selectStarredAssetsFilter() {
    await this.filterDropdown.click();
    await this.starredOptionFilter.click();
  }

  @step("Star coin $0")
  async starCoin(ticker: string) {
    await this.starButton(ticker.toLowerCase()).click();
  }

  @step("Expect coin $0 to be visible")
  async expectCoinToBeVisible(ticker: string) {
    await expect(this.coinRow(ticker.toLowerCase())).toBeVisible();
  }

  @step("Expect coin $0 to not be visible")
  async expectCoinToNotBeVisible(ticker: string) {
    await expect(this.coinRow(ticker.toLowerCase())).not.toBeVisible();
  }
}
