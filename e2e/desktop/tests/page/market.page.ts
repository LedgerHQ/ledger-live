import { AppPage } from "./abstractClasses";
import { step } from "../misc/reporters/step";
import { expect } from "@playwright/test";

export class MarketPage extends AppPage {
  private readonly navbarTitle = this.page.getByTestId("page-header-title");
  private searchInput = this.page.getByTestId("market-search-input");
  private loadingPlaceholder = this.page.getByTestId("loading-placeholder");
  private readonly coinRow = (ticker: string) =>
    this.page.getByTestId(`market-${ticker}-row`).first();
  private coinPageContainer = this.page.getByTestId("market-coin-page-container");
  private swapButtonOnAsset = this.page.getByTestId("market-coin-swap-button");

  private readonly buyButton = (ticker: string) =>
    this.coinRow(ticker).getByTestId(`market-${ticker}-buy-button-icon`);
  private swapButton = (ticker: string) =>
    this.coinRow(ticker).getByTestId(`market-${ticker}-swap-button-icon`);
  private stakeButton = (ticker: string) =>
    this.coinRow(ticker).getByTestId(`market-${ticker}-stake-button-icon`);

  // Filter controls - using text selector because react-select doesn't forward data-testid
  private filterDropdown = this.page.getByText("Show").first();
  private readonly starButton = (ticker: string) =>
    this.page.getByTestId(`market-${ticker}-star-button`).first();
  private starredOptionFilter = this.page.getByRole("option", { name: "Starred Assets" });
  // Asset discoverability UI: the "Show / Starred Assets" dropdown is replaced by a category tab.
  private readonly starredCategoryTab = this.page.getByTestId("market-category-switcher-starred");
  private readonly allCategoryTab = this.page.getByTestId("market-category-switcher-all");

  private readonly categorySwitcher = this.page.getByTestId("market-category-switcher");
  private readonly categoryTab = (value: string) =>
    this.page.getByTestId(`market-category-switcher-${value}`);

  @step("Search for $0")
  async search(query: string) {
    await this.searchInput.fill(query);
  }

  @step("Validate Market List")
  async validateMarketList() {
    await expect(this.navbarTitle).toHaveText("Market");
    await expect(this.coinRow("btc")).toBeVisible();
    await expect(this.coinRow("eth")).toBeVisible();
  }

  @step("Open coin page for $0")
  async openCoinPage(ticker: string) {
    await this.coinRow(ticker.toLowerCase()).click();
    await this.coinPageContainer.waitFor({ state: "attached" });
    await this.loadingPlaceholder.first().waitFor({ state: "detached" });
  }

  @step("Click coin row $0")
  async clickCoinRow(ticker: string) {
    await this.coinRow(ticker.toLowerCase()).click();
  }

  @step("Open buy page for $0")
  async openBuyPage(ticker: string) {
    const button = this.buyButton(ticker.toLowerCase());
    await button.click();
  }

  @step("Click on swap button for $0")
  async startSwapForSelectedTicker(ticker: string) {
    const button = this.swapButton(ticker.toLowerCase());
    await button.click();
  }

  @step("Click on swap button on asset")
  async clickOnSwapButtonOnAsset() {
    await this.swapButtonOnAsset.click();
  }

  @step("Click on stake button for $0")
  async stakeButtonClick(ticker: string) {
    const button = this.stakeButton(ticker.toLowerCase());
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

  @step("Select the Favorites (starred) market category")
  async selectStarredCategory() {
    await this.starredCategoryTab.click();
  }

  @step("Select the All market category")
  async selectAllCategory() {
    await this.allCategoryTab.click();
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

  @step("Expect Market page to be visible")
  async expectMarketPageVisible() {
    await expect(this.navbarTitle).toHaveText("Market");
    await expect(this.categorySwitcher).toBeVisible();
  }

  @step("Expect category tab $0 to be selected")
  async expectCategorySelected(value: string) {
    await expect(this.categoryTab(value)).toHaveAttribute("aria-checked", "true");
  }

  @step("Select category tab $0")
  async selectCategory(value: string) {
    await this.categoryTab(value).click();
  }
}
