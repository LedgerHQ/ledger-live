import { AppPage } from "tests/page/abstractClasses";
import { step } from "tests/misc/reporters/step";
import { expect } from "@playwright/test";
import { PageHeader } from "tests/component/pageHeader.component";
import { INTERVAL, TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";

export class MarketPage extends AppPage {
  private readonly pageHeader = new PageHeader(this.page);
  private readonly coinRow = (ticker: string) =>
    this.page.getByTestId(`market-${ticker}-row`).first();
  private readonly coinPageContainer = this.page.getByTestId("asset-detail-header");
  private readonly swapButton = (ticker: string) =>
    this.coinRow(ticker).getByTestId(`market-${ticker}-swap-button`);
  private readonly starredCategoryTab = this.page.getByTestId("market-category-switcher-starred");
  private readonly allCategoryTab = this.page.getByTestId("market-category-switcher-all");

  private readonly categorySwitcher = this.page.getByTestId("market-category-switcher");
  private readonly categoryTab = (value: string) =>
    this.page.getByTestId(`market-category-switcher-${value}`);
  private readonly actionsMenu = (ticker: string) =>
    this.page.getByTestId(`market-${ticker}-actions-menu`).first();
  private readonly listData = this.page.getByTestId("market-list-data");
  private readonly buySellMenuItem = this.page.getByRole("menuitem", {
    name: "Buy/Sell",
  });
  private readonly addToFavoritesMenuItem = this.page.getByRole("menuitem", {
    name: "Add to favorites",
  });

  // The list is virtualised, so scroll its nearest scrollable ancestor to render more rows.
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
    await expect
      .poll(
        async () => {
          if ((await row.count()) > 0) return true;
          await this.scrollMarketListBy(600);
          return false;
        },
        {
          timeout: TIMEOUT.xlarge,
          intervals: [INTERVAL.tick],
          message: `Market row "${ticker}" never mounted while scrolling the list.`,
        },
      )
      .toBe(true);

    await row.scrollIntoViewIfNeeded();
    await expect(row).toBeVisible();
  }

  private async openActionsMenu(ticker: string) {
    await this.ensureCoinRowVisible(ticker);
    await this.actionsMenu(ticker.toLowerCase()).click();
  }

  @step("Validate Market List")
  async validateMarketList() {
    await expect(this.pageHeader.title).toHaveText("Market");
    await expect(this.coinRow("btc")).toBeVisible();
    await expect(this.coinRow("eth")).toBeVisible();
  }

  @step("Open coin page for $0")
  async openCoinPage(ticker: string) {
    await this.ensureCoinRowVisible(ticker);
    await this.coinRow(ticker.toLowerCase()).click();
    await this.coinPageContainer.waitFor({ state: "visible" });
  }

  @step("Click coin row $0")
  async clickCoinRow(ticker: string) {
    await this.coinRow(ticker.toLowerCase()).click();
  }

  @step("Open buy page for $0")
  async openBuyPage(ticker: string) {
    await this.openActionsMenu(ticker);
    await this.buySellMenuItem.click();
  }

  @step("Click on swap button for $0")
  async startSwapForSelectedTicker(ticker: string) {
    const lowerTicker = ticker.toLowerCase();
    await this.ensureCoinRowVisible(lowerTicker);
    await this.swapButton(lowerTicker).click();
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
    await this.openActionsMenu(ticker);
    await this.addToFavoritesMenuItem.click();
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
}
