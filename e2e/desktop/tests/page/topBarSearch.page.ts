import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";

export class TopBarSearch extends AppPage {
  private readonly searchInput = this.page.getByTestId("topbar-search-input");
  private readonly popover = this.page.getByTestId("topbar-search-popover");
  private readonly defaultOverlay = this.page.getByTestId("search-overlay-default");
  private readonly cryptosSection = this.defaultOverlay.getByTestId("cryptos-section");
  private readonly cryptosSeeAll = this.defaultOverlay.getByTestId("cryptos-see-all");
  private readonly stocksSection = this.defaultOverlay.getByTestId("stocks-section");
  private readonly stocksSeeAll = this.defaultOverlay.getByTestId("stocks-see-all");
  private readonly resultsList = this.popover.getByTestId("search-results-list");
  private readonly firstResult = this.resultsList
    .locator('[data-testid^="search-result-item-"]')
    .first();

  @step("Open the global search overlay")
  async open() {
    await this.searchInput.click();
    await this.popover.waitFor({ state: "visible" });
    await this.defaultOverlay.waitFor({ state: "visible" });
  }

  @step("Expect Cryptos and Stocks categories to be visible")
  async expectCategoriesVisible() {
    await expect(this.cryptosSection).toBeVisible();
    await expect(this.stocksSection).toBeVisible();
  }

  @step("Select the Cryptos category")
  async selectCryptosCategory() {
    await this.cryptosSeeAll.click();
  }

  @step("Select the Stocks category")
  async selectStocksCategory() {
    await this.stocksSeeAll.click();
  }

  @step("Search for $0")
  async searchFor(query: string) {
    await this.searchInput.fill(query);
    await this.resultsList.waitFor({ state: "visible" });
  }

  @step("Clear the search field")
  async clearSearch() {
    await this.searchInput.fill("");
  }

  @step("Expect first search result to be $0")
  async expectFirstResultTicker(ticker: string) {
    await expect(this.firstResult).toBeVisible();
    await expect(this.firstResult).toHaveAttribute(
      "data-testid",
      `search-result-item-${ticker.toLowerCase()}`,
    );
  }
}
