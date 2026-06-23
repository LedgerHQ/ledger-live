import { Step } from "jest-allure2-reporter/api";
import { retryUntilTimeout } from "../../utils/retry";

export default class TopBarSearchPage {
  private readonly topBarSearchButtonId = "topbar-search";
  private readonly screenId = "global-search-screen";
  private readonly searchInputId = "global-search-input";
  private readonly defaultSectionsId = "global-search-default-sections";
  private readonly defaultsErrorId = "global-search-defaults-error-state";
  private readonly cryptosSectionId = "global-search-cryptos-section";
  private readonly cryptosSectionHeaderId = "global-search-cryptos-section-header";
  private readonly stocksSectionId = "global-search-stocks-section";
  private readonly stocksSectionHeaderId = "global-search-stocks-section-header";
  private readonly searchResultsId = "global-search-results";
  private readonly marketItemId = (currencyId: string) => `marketItem-${currencyId}`;
  private readonly marketResultRegExp = /^marketItem-.+$/;

  @Step("Open the global search screen from the portfolio top bar")
  async open() {
    await waitForElementById(this.topBarSearchButtonId);
    await retryUntilTimeout(async () => {
      if (await IsIdPresent(this.screenId)) return;
      await tapById(this.topBarSearchButtonId);
      await waitForElementById(this.screenId, 5000, { checkVisibility: false });
    });
    await waitForElementById(this.defaultSectionsId, undefined, {
      errorElementId: this.defaultsErrorId,
      checkVisibility: false,
    });
  }

  @Step("Expect Cryptos and Stocks categories to be visible")
  async expectCategoriesVisible() {
    await waitForElementById(this.cryptosSectionId);
    await detoxExpect(getElementById(this.stocksSectionId)).toExist();
  }

  @Step("Select the Cryptos category")
  async selectCryptosCategory() {
    await tapById(this.cryptosSectionHeaderId);
  }

  @Step("Select the Stocks category")
  async selectStocksCategory() {
    await waitForElementById(this.defaultSectionsId, undefined, {
      checkVisibility: false,
    });
    await scrollToId(this.stocksSectionHeaderId, this.defaultSectionsId);
    await tapById(this.stocksSectionHeaderId);
  }

  @Step("Search for $0")
  async searchFor(query: string) {
    await typeTextById(this.searchInputId, query, false);
    await waitForElementById(this.searchResultsId, 60000, {
      checkVisibility: false,
    });
  }

  @Step("Clear the search field")
  async clearSearch() {
    await clearTextByElement(getElementById(this.searchInputId));
  }

  @Step("Expect first search result to be $0")
  async expectFirstResult(currencyId: string) {
    const expectedId = this.marketItemId(currencyId);
    await waitForElementById(expectedId, undefined, { checkVisibility: false });
    const firstResultId = await getIdByRegexp(this.marketResultRegExp, 0);
    jestExpect(firstResultId).toBe(expectedId);
  }
}
