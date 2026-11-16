import { Step } from "jest-allure2-reporter/api";
import { byId } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";

export default class TopBarSearchPage {
  private readonly topBarSearchButton = byId("topbar-search");
  private readonly searchInput = byId("global-search-input");
  private readonly defaultSections = byId("global-search-default-sections");
  private readonly defaultsError = byId("global-search-defaults-error-state");
  private readonly cryptosSection = byId("global-search-cryptos-section");
  private readonly cryptosSectionHeader = byId("global-search-cryptos-section-header");
  private readonly stocksSection = byId("global-search-stocks-section");
  private readonly stocksSectionHeader = byId("global-search-stocks-section-header");
  private readonly searchResults = byId("global-search-results");
  private readonly firstMarketResult = byId(/^marketItem-.+$/);
  private readonly marketItemId = (currencyId: string) => `marketItem-${currencyId}`;
  private readonly marketItem = (currencyId: string) => byId(this.marketItemId(currencyId));

  @Step("Open the global search screen from the portfolio top bar")
  async open() {
    await this.topBarSearchButton.tap();
    await this.searchInput.waitVisible();
    await this.defaultSections.waitExist(TIMEOUT.xxlarge, this.defaultsError);
  }

  @Step("Expect Cryptos and Stocks categories to be visible")
  async expectCategoriesVisible() {
    await this.cryptosSection.waitVisible();
    await this.stocksSection.expectExist();
  }

  @Step("Select the Cryptos category")
  async selectCryptosCategory() {
    await this.cryptosSectionHeader.tap();
  }

  @Step("Select the Stocks category")
  async selectStocksCategory() {
    await this.defaultSections.waitExist();
    await this.stocksSectionHeader.scrollTo(this.defaultSections);
    await this.stocksSectionHeader.tap();
  }

  @Step("Search for {{{0}}}")
  async searchFor(query: string) {
    await this.searchInput.replaceTextKeepKeyboard(query);
    await this.searchResults.waitExist();
  }

  @Step("Clear the search field")
  async clearSearch() {
    await this.searchInput.clearText();
  }

  @Step("Expect first search result to be {{{0}}}")
  async expectFirstResult(currencyId: string) {
    await this.marketItem(currencyId).waitVisible();
    await this.firstMarketResult.expectId(this.marketItemId(currencyId));
  }
}
