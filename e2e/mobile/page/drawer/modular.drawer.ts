import { Feature_ModularDrawer } from "@ledgerhq/types-live";
import { getFlags } from "../../bridge/server";
import { Account } from "@ledgerhq/live-common/lib/e2e/enum/Account";
import { isIos } from "../../helpers/commonHelpers";

export default class ModularDrawer {
  accountItem = "account-item";
  searchBarId = "modular-drawer-search-input";
  selectCryptoScrollViewId = "modular-drawer-select-crypto-scrollView";
  modularDrawerFlowViewId = "modular-drawer-flow-view";
  networkBasedTitleIdMAD = "modular-drawer-Network-title";
  assetBasedTitleIdMAD = "modular-drawer-Asset-title";
  networkSelectionScrollViewId = "modular-drawer-network-selection-scrollView";
  accountTitleIdMAD = "modular-drawer-Account-title";
  addNewOrExistingAccountButton = "add-new-account-button";
  drawerCloseButtonId = "drawer-close-button";
  drawerBackButtonId = "drawer-back-button";
  accountItemNameId = (name: string) => `account-item-name-${name}`;

  searchBar = () => getElementById(this.searchBarId);
  assetItemByTicker = (ticker: string) => new RegExp(`asset-item-${ticker}`, "i");
  networkItemIdMAD = (networkId: string) => new RegExp(`network-item-${networkId}`, "i");

  private flags: Feature_ModularDrawer | null = null;

  private async loadFlags(): Promise<void> {
    this.flags ??= JSON.parse(await getFlags()).llmModularDrawer;
  }

  async isFlowEnabled<K extends keyof NonNullable<Feature_ModularDrawer["params"]>>(
    flow: K,
  ): Promise<boolean> {
    await this.loadFlags();
    return this.flags!.enabled && Boolean(this.flags!.params?.[flow]);
  }

  getNetworkNameForAccount(account: Account): string {
    return account?.parentAccount === undefined
      ? account.currency.speculosApp.name
      : account?.parentAccount?.currency.name;
  }

  @Step("Select first account in modular drawer")
  async selectFirstAccount() {
    await tapById(this.accountItem, 0);
  }

  @Step("Select Account")
  async selectAccount(accountName: string): Promise<void> {
    const accountItemId = this.accountItemNameId(accountName);
    await tapById(accountItemId);
  }

  @Step("Tap on drawer back button")
  async tapDrawerBackButton() {
    await tapById(this.drawerBackButtonId);
  }

  @Step("Validate account(s) present on account list")
  async validateNumberOfAccounts(expectedCount: number) {
    const elements = await countElementsById(this.accountItem);
    jestExpect(elements).toBe(expectedCount);
  }

  @Step("Perform search on modular drawer by ticker")
  async performSearchByTicker(ticker: string) {
    // await waitForElementById(this.searchBarId);
    await typeTextByElement(this.searchBar(), ticker);
  }

  @Step("Select currency in receive list by ticker")
  async selectCurrencyByTicker(ticker: string): Promise<void> {
    const assetItemId = this.assetItemByTicker(ticker);
    if (!(await IsIdVisible(assetItemId))) {
      await scrollToId(assetItemId, this.selectCryptoScrollViewId);
    }
    await tapById(assetItemId, 0);
  }

  @Step("Select network in list if needed")
  async selectNetworkIfAsked(networkName: string): Promise<void> {
    if (await IsIdVisible(this.networkBasedTitleIdMAD)) {
      const id = this.networkItemIdMAD(networkName);
      if (!(await IsIdVisible(id))) {
        await getElementById(this.networkBasedTitleIdMAD).swipe("up");
        await scrollToId(id, this.networkSelectionScrollViewId);
      }
      await tapById(id, 0);
    }
  }

  @Step("Select network")
  async selectNetwork(networkName: string): Promise<void> {
    const id = this.networkItemIdMAD(networkName);
    if (!(await IsIdVisible(id))) {
      await scrollToId(id, this.networkSelectionScrollViewId);
    }
    await tapById(id, 0);
  }

  @Step("Select currency in modular drawer")
  async selectAsset(account: Account): Promise<void> {
    await this.performSearchByTicker(account.currency.ticker);
    await this.selectCurrencyByTicker(account.currency.ticker);
    const networkName = this.getNetworkNameForAccount(account);
    await this.selectNetworkIfAsked(networkName);
    await this.selectFirstAccount();
  }

  /**
   * Workaround for iOS Buy/Sell flow where drawer opens over WebView.
   * Avoids any kind of waitFor visibility checks that cause Ledger Live App to freeze.
   * Falls back to standard selectAsset on Android.
   */
  @Step("Select currency in modular drawer - (workaround) buy sell flow")
  async selectAssetBuySellIosWorkaround(account: Account): Promise<void> {
    if (!isIos()) {
      return this.selectAsset(account);
    }

    await this.performSearchByTicker(account.currency.ticker);
    const assetItemId = this.assetItemByTicker(account.currency.ticker);
    await tapById(assetItemId, 0);

    const modularDrawerAttributes = await getAttributesOfElement(this.modularDrawerFlowViewId, 0);
    if (modularDrawerAttributes.label?.includes("Select network")) {
      const networkName = this.getNetworkNameForAccount(account);
      const id = this.networkItemIdMAD(networkName);
      await tapById(id, 0);
    }
    await this.selectFirstAccount();
  }

  @Step("Validate account(s) present on account list")
  async validateAccountsScreen(accounts?: string[]): Promise<void> {
    const modularDrawerAttributes = await getAttributesOfElement(this.modularDrawerFlowViewId, 0);
    jestExpect(modularDrawerAttributes.label).toMatch(/Select account.*/i);
    if (!accounts) {
      detoxExpect(getElementById(this.accountItem)).not.toBeVisible();
      return;
    }
    for (const account of accounts) {
      const accountItemId = this.accountItemNameId(account);
      await detoxExpect(getElementById(accountItemId)).toBeVisible();
    }
  }

  @Step("Validate network(s) present on network list")
  async validateNetworksScreen(networks: string[]): Promise<void> {
    const modularDrawerAttributes = await getAttributesOfElement(this.modularDrawerFlowViewId, 0);
    jestExpect(modularDrawerAttributes.label).toMatch(/Select network.*/i);
    for (const network of networks) {
      const networkItemId = this.networkItemIdMAD(network);
      await scrollToId(networkItemId, this.networkSelectionScrollViewId);
      await detoxExpect(getElementById(networkItemId)).toBeVisible();
    }
  }

  @Step("Validate assets present on account list")
  async validateAssetsScreen(assets: string[]): Promise<void> {
    const modularDrawerAttributes = await getAttributesOfElement(this.modularDrawerFlowViewId, 0);
    jestExpect(modularDrawerAttributes.label).toMatch(/Select asset.*/i);
    for (const asset of assets) {
      const assetItemId = this.assetItemByTicker(asset);
      await detoxExpect(getElementById(assetItemId)).toBeVisible();
    }
  }

  @Step("Tap on add new or existing account button")
  async tapAddNewOrExistingAccountButtonMAD(): Promise<void> {
    await tapById(this.addNewOrExistingAccountButton);
  }

  @Step("Expect (Select Asset) page")
  async checkSelectAssetPage() {
    await waitForElementById(this.assetBasedTitleIdMAD);
    await detoxExpect(getElementById(this.assetBasedTitleIdMAD)).toBeVisible();
    await detoxExpect(this.searchBar()).toBeVisible();
  }

  @Step("Tap on drawer close button")
  async tapDrawerCloseButton(options?: { onlyIfVisible: boolean }) {
    options = options ?? { onlyIfVisible: false };
    if (options.onlyIfVisible && !(await IsIdVisible(this.drawerCloseButtonId))) {
      return;
    }
    await waitForElementById(this.drawerCloseButtonId);
    await tapById(this.drawerCloseButtonId);
  }
}
