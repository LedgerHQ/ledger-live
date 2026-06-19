import { Step } from "jest-allure2-reporter/api";

export default class TopBarSearchPage {
  topBarSearchButtonId = "topbar-search";
  screenId = "global-search-screen";
  searchInputId = "global-search-input";
  defaultSectionsId = "global-search-default-sections";
  cryptosSectionId = "global-search-cryptos-section";
  cryptosSectionHeaderId = "global-search-cryptos-section-header";
  stocksSectionId = "global-search-stocks-section";
  stocksSectionHeaderId = "global-search-stocks-section-header";
  searchResultsId = "global-search-results";
  marketItemId = (currencyId: string) => `marketItem-${currencyId}`;

  @Step("Open the global search screen from the portfolio top bar")
  async open() {
    await waitForElementById(this.topBarSearchButtonId);
    await tapById(this.topBarSearchButtonId);
    await waitForElementById(this.screenId);
    await waitForElementById(this.defaultSectionsId);
  }

  @Step("Expect Cryptos and Stocks categories to be visible")
  async expectCategoriesVisible() {
    // Wait for the section to render before asserting: with synchronization disabled
    // (animated screens), one-shot matchers can run mid-transition (e.g. right after
    // navigating back from the market). Cryptos is at the top of the scroll view; the
    // Stocks section sits below the fold (and under the keyboard), so only assert it exists.
    await waitForElementById(this.cryptosSectionId);
    await detoxExpect(getElementById(this.stocksSectionId)).toExist();
  }

  @Step("Select the Cryptos category")
  async selectCryptosCategory() {
    await tapById(this.cryptosSectionHeaderId);
  }

  @Step("Select the Stocks category")
  async selectStocksCategory() {
    await waitForElementById(this.defaultSectionsId);
    await scrollToId(this.stocksSectionHeaderId, this.defaultSectionsId);
    await tapById(this.stocksSectionHeaderId);
  }

  @Step("Search for $0")
  async searchFor(query: string) {
    await typeTextById(this.searchInputId, query, false);
    // The results FlatList is largely covered by the open keyboard, so it never reaches
    // the visibility threshold; assert it exists and let expectFirstResult check the row.
    await waitForElementById(this.searchResultsId, 60000, { checkVisibility: false });
  }

  @Step("Clear the search field")
  async clearSearch() {
    await clearTextByElement(getElementById(this.searchInputId));
  }

  @Step("Expect first search result to be $0")
  async expectFirstResult(currencyId: string) {
    await waitForElementById(this.marketItemId(currencyId));
    await detoxExpect(getElementById(this.marketItemId(currencyId))).toBeVisible();
  }
}
