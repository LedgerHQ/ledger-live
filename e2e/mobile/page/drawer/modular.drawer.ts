import { delay } from "../../helpers/commonHelpers";
import { Account } from "@ledgerhq/live-common/lib/e2e/enum/Account";

export default class ModularDrawer {
  accountItem = "account-item";
  searchBarId = "modular-drawer-search-input";
  selectCryptoScrollViewId = "select-crypto-scrollView";
  networkBasedTitleIdMAD = "modular-drawer-Network-title";
  assetBasedTitleIdMAD = "modular-drawer-Asset-title";
  networkSelectionScrollViewId = "network-selection-scrollView";
  accountItem = "account-item";

  searchBar = () => getElementById(this.searchBarId);
  assetItem = (addressOrId: string) => new RegExp(`asset-item-${addressOrId}`, "i");
  networkItemIdMAD = (networkId: string) => `network-item-${networkId}`;

  async isModularDrawerVisible(): Promise<boolean> {
    //return await IsIdVisible(this.searchBarId, 2000);
    return true;
  }

  @Step("Select first account in modular drawer")
  async selectFirstAccount() {
    await tapById(this.accountItem, 0);
  }

  @Step("Perform search on modular drawer")
  async performSearch(searchText: string) {
    await waitForElementById(this.searchBarId);
    await typeTextByElement(this.searchBar(), searchText);
    await delay(500);
  }

  @Step("Select currency in receive list")
  async selectCurrency(addressOrId: string): Promise<void> {
    const assetItemId = this.assetItem(addressOrId);
    if (!(await IsIdVisible(assetItemId))) {
      await scrollToId(assetItemId, this.selectCryptoScrollViewId);
    }
    await delay(500);
    await tapById(assetItemId);
  }

  @Step("Select network in list if needed")
  async selectNetworkIfAsked(networkName: string): Promise<void> {
    await delay(1000);
    if (await IsTextVisible(networkName, 2000)) {
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

  @Step("Select currency $0 in modular drawer")
  async selectAsset(account: Account): Promise<void> {
    await this.performSearch(account.currency.name);
    await this.selectCurrency(account.currency.contractAddress ?? account.currency.id);
    await this.selectNetworkIfAsked(
      account.parentAccount ? account.parentAccount.currency.name : account.currency.name,
    );
    await this.selectFirstAccount();
  }
}
