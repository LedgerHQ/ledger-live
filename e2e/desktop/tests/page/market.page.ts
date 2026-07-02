import { AppPage } from "./abstractClasses";
import { step } from "../misc/reporters/step";
import { expect } from "@playwright/test";
import { isAssetDiscoverabilityEnabled } from "tests/utils/featureFlagUtils";
import { PageHeader } from "tests/component/pageHeader.component";

export class MarketPage extends AppPage {
  private readonly pageHeader = new PageHeader(this.page);
  private searchInput = this.page.getByTestId("market-search-input");
  private readonly coinRow = (ticker: string) =>
    this.page.getByTestId(`market-${ticker}-row`).first();
  private loadingPlaceholder = this.page.getByTestId("loading-placeholder");
  // aggregatedAssets ON redirects the legacy coin page to the AssetDetail page; accept either.
  private readonly coinPageContainer = this.page
    .getByTestId("market-coin-page-container")
    .or(this.page.getByTestId("asset-detail-header"));
  private swapButtonOnAsset = this.page.getByTestId("market-coin-swap-button");
  private readonly embeddedSwapContainer = this.page.getByTestId("embedded-swap-container");

  private readonly buyButton = (ticker: string) =>
    this.coinRow(ticker).getByTestId(`market-${ticker}-buy-button-icon`);
  private swapButton = (ticker: string) =>
    this.coinRow(ticker).getByTestId(`market-${ticker}-swap-button-icon`);
  private readonly discoSwapButton = (ticker: string) =>
    this.coinRow(ticker).getByTestId(`market-${ticker}-swap-button`);
  private stakeButton = (ticker: string) =>
    this.coinRow(ticker).getByTestId(`market-${ticker}-stake-button-icon`);

  // Filter controls - using text selector because react-select doesn't forward data-testid
  private filterDropdown = this.page.getByText("Show").first();
  private readonly starButton = (ticker: string) =>
    this.page.getByTestId(`market-${ticker}-star-button`).first();
  private readonly starredOptionFilter = this.page.getByRole("option", {
    name: "Starred Assets",
  });
  private readonly starredCategoryTab = this.page.getByTestId("market-category-switcher-starred");
  private readonly allCategoryTab = this.page.getByTestId("market-category-switcher-all");

  private readonly categorySwitcher = this.page.getByTestId("market-category-switcher");
  private readonly categoryTab = (value: string) =>
    this.page.getByTestId(`market-category-switcher-${value}`);
  // Asset discoverability UI: per-row buy/sell and favourite live in this overflow menu.
  private readonly actionsMenu = (ticker: string) =>
    this.page.getByTestId(`market-${ticker}-actions-menu`).first();
  private readonly listData = this.page.getByTestId("market-list-data");
  private readonly buySellMenuItem = this.page.getByRole("menuitem", {
    name: "Buy/Sell",
  });
  private readonly addToFavoritesMenuItem = this.page.getByRole("menuitem", {
    name: "Add to favorites",
  });

  async isLegacyMarketList(): Promise<boolean> {
    return !(await isAssetDiscoverabilityEnabled(this.page));
  }

  // The disco list is virtualised, so scroll its nearest scrollable ancestor to render more rows.
  private async scrollMarketListBy(deltaY: number) {
    await this.listData.evaluate((node: HTMLElement, dy: number) => {
      const maxAncestorsToCheck = 20;
      let scroller: HTMLElement | null = node;
      for (let i = 0; i < maxAncestorsToCheck; i++) {
        if (!scroller || scroller.scrollHeight > scroller.clientHeight) break;
        scroller = scroller.parentElement;
      }
      if (scroller) scroller.scrollTop += dy;
    }, deltaY);
  }

  private async ensureCoinRowVisible(ticker: string) {
    const lowerTicker = ticker.toLowerCase();
    const row = this.coinRow(lowerTicker);
    await this.listData.or(this.coinRow("btc")).first().waitFor({ state: "visible" });

    // Mid-cap rows mount only once scrolled into range, so scroll until the row appears.
    for (let attempt = 0; attempt < 40; attempt++) {
      if ((await row.count()) > 0) {
        await row.scrollIntoViewIfNeeded();
        await expect(row).toBeVisible();
      } else {
        await this.scrollMarketListBy(600);
        await this.page.waitForTimeout(150);
      }
    }
    await expect(row).toBeVisible();
  }

  private async openActionsMenu(ticker: string) {
    await this.ensureCoinRowVisible(ticker);
    await this.actionsMenu(ticker.toLowerCase()).click();
  }

  @step("Search for $0")
  async search(query: string) {
    if (await this.isLegacyMarketList()) {
      await this.searchInput.fill(query);
    } else {
      await this.ensureCoinRowVisible(query);
    }
  }

  @step("Validate Market List")
  async validateMarketList() {
    await expect(this.pageHeader.title).toHaveText("Market");
    await expect(this.coinRow("btc")).toBeVisible();
    await expect(this.coinRow("eth")).toBeVisible();
  }

  @step("Open coin page for $0")
  async openCoinPage(ticker: string) {
    if (!(await this.isLegacyMarketList())) {
      await this.ensureCoinRowVisible(ticker);
    }
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
    if (await this.isLegacyMarketList()) {
      await this.buyButton(ticker.toLowerCase()).click();
    } else {
      await this.openActionsMenu(ticker);
      await this.buySellMenuItem.click();
    }
  }

  @step("Click on swap button for $0")
  async startSwapForSelectedTicker(ticker: string) {
    const lowerTicker = ticker.toLowerCase();
    if (await this.isLegacyMarketList()) {
      await this.swapButton(lowerTicker).click();
    } else {
      await this.ensureCoinRowVisible(lowerTicker);
      await this.discoSwapButton(lowerTicker).click();
    }
  }

  @step("Click on swap button on asset")
  async clickOnSwapButtonOnAsset() {
    // Legacy exposes a swap CTA to click; AssetDetail mounts the embedded swap rail (nothing to click).
    await this.swapButtonOnAsset
      .or(this.embeddedSwapContainer)
      .first()
      .waitFor({ state: "visible" });
    if (await this.swapButtonOnAsset.isVisible()) {
      await this.swapButtonOnAsset.click();
    }
  }

  @step("Click on stake button for $0")
  async stakeButtonClick(ticker: string) {
    const button = this.stakeButton(ticker.toLowerCase());
    await button.click();
  }

  @step("Expect starred filter control to be visible")
  async expectFilterDropdownToBeVisible() {
    if (await this.isLegacyMarketList()) {
      await expect(this.filterDropdown).toBeVisible();
    } else {
      await expect(this.starredCategoryTab).toBeVisible();
    }
  }

  @step("Filter the list to starred assets only")
  async selectStarredAssetsFilter() {
    if (await this.isLegacyMarketList()) {
      await this.filterDropdown.click();
      await this.starredOptionFilter.click();
    } else {
      await this.selectStarredCategory();
    }
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
    if (await this.isLegacyMarketList()) {
      await this.starButton(ticker.toLowerCase()).click();
    } else {
      await this.openActionsMenu(ticker);
      await this.addToFavoritesMenuItem.click();
    }
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
    await expect(this.pageHeader.title).toHaveText("Market");
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
