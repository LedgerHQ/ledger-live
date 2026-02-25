import { by, element, expect } from "detox";
import { Step } from "jest-allure2-reporter/api";
import { currencyParam, openDeeplink } from "../../helpers/commonHelpers";

export default class ModularDrawer {
  baseLinkAddAccount = "add-account";
  baseLinkReceive = "receive";
  accountItem = "account-item";
  searchBarId = "modular-drawer-search-input";
  selectCryptoScrollViewId = "modular-drawer-select-crypto-scrollView";
  networkBasedTitleIdMAD = "modular-drawer-Network-title";
  assetBasedTitleIdMAD = "modular-drawer-Asset-title";
  networkSelectionScrollViewId = "modular-drawer-network-selection-scrollView";
  accountTitleIdMAD = "modular-drawer-Account-title";
  addNewOrExistingAccountButton = "add-new-account-button";
  drawerCloseButtonId = "drawer-close-button";

  searchBar = () => getElementById(this.searchBarId);
  assetItem = (addressOrId: string) => `asset-item-${addressOrId}`;
  networkItemIdMAD = (networkId: string) => `network-item-${networkId}`;

  @Step("Open add account via deeplink")
  async openAddAccountDeeplink(currency?: string) {
    const link = currency
      ? this.baseLinkAddAccount + currencyParam + currency
      : this.baseLinkAddAccount;
    await openDeeplink(link);
  }

  @Step("Open receive via deeplink")
  async openReceiveDeeplink(currency?: string) {
    const link = currency ? this.baseLinkReceive + currencyParam + currency : this.baseLinkReceive;
    await openDeeplink(link);
  }

  @Step("Select first account in modular drawer")
  async selectFirstAccount() {
    await tapById(this.accountItem, 0);
  }
  async selectAccount(index: number) {
    await tapById(this.accountItem, index);
  }

  @Step("Perform search on modular drawer by ticker")
  async performSearchByTicker(ticker: string) {
    await waitForElementById(this.searchBarId);
    await typeTextByElement(this.searchBar(), ticker);
  }

  @Step("Select currency in list by ticker")
  async selectCurrencyByTicker(ticker: string): Promise<void> {
    const assetItemId = this.assetItem(ticker);
    await tapById(assetItemId, 0);
  }

  @Step("Select network in list if needed")
  async selectNetworkIfAsked(networkName: string): Promise<void> {
    if (await IsIdVisible(this.networkBasedTitleIdMAD)) {
      const id = this.networkItemIdMAD(networkName);

      try {
        if (!(await IsIdVisible(id))) {
          await scrollToId(id, this.networkSelectionScrollViewId);
        }
      } catch {
        // do nothing
      } finally {
        await tapById(id, 0);
      }
    }
  }

  @Step("Tap on add new or existing account button")
  async tapAddNewOrExistingAccountButtonMAD(): Promise<void> {
    await tapById(this.addNewOrExistingAccountButton);
  }

  @Step("Expect (Select Asset) page")
  async checkSelectAssetPage() {
    await waitForElementById(this.assetBasedTitleIdMAD);
    await expect(getElementById(this.assetBasedTitleIdMAD)).toBeVisible();
    await expect(this.searchBar()).toBeVisible();
  }

  async expectNumberOfAccountInListIsDisplayed(currencyId: string, accountNumber: number) {
    const accountCount: string = accountNumber + " account" + (accountNumber > 1 ? "s" : "");
    const rowId = this.networkItemIdMAD(currencyId);

    // Wait for the network row to be visible
    await waitForElementById(rowId);

    const rowWithCountMatcher = by.id(rowId).withDescendant(by.text(accountCount));
    await expect(element(rowWithCountMatcher)).toBeVisible();
  }

  @Step("Tap on drawer close button")
  async tapDrawerCloseButton() {
    await waitForElementById(this.drawerCloseButtonId);
    await tapById(this.drawerCloseButtonId);
  }
}
