import { Currency } from "@ledgerhq/live-common/lib/e2e/enum/Currency";
import { delay } from "../../helpers/commonHelpers";

export default class ModularDrawer {
  searchBarId = "modular-drawer-search-input";
  selectCryptoScrollViewId = "select-crypto-scrollView";
  networkBasedTitleIdMAD = "modular-drawer-Network-title";
  assetBasedTitleIdMAD = "modular-drawer-Asset-title";
  networkSelectionScrollViewId = "network-selection-scrollView";

  searchBar = () => getElementById(this.searchBarId);
  currencyNameIdMAD = (currencyName: string) => `asset-item-${currencyName}`;
  networkItemIdMAD = (networkId: string) => `network-item-${networkId}`;

  @Step("Perform search on modular drawer")
  async performSearch(text: Currency) {
    await waitForElementById(this.searchBarId);
    await typeTextByElement(this.searchBar(), text.ticker);
    await delay(500);
  }

  @Step("Select currency in receive list")
  async selectCurrency(currencyName: string): Promise<void> {
    if (!(await IsTextVisible(currencyName))) {
      await scrollToText(currencyName, this.selectCryptoScrollViewId);
    }
    await delay(500);
    await tapByText(currencyName);
  }

  @Step("Select network in list if needed")
  async selectNetworkIfAsked(networkName: string): Promise<void> {
    await delay(1000);
    if (await IsTextVisible(networkName)) {
      await this.selectNetwork(networkName);
    }
  }

  @Step("Select network")
  async selectNetwork(networkName: string): Promise<void> {
    if (!(await IsTextVisible(networkName))) {
      await scrollToText(networkName, this.networkSelectionScrollViewId);
    }
    await delay(500);
    await tapByText(networkName);
  }
}
