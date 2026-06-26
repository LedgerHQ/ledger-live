import { Step } from "jest-allure2-reporter/api";
import type { Features } from "@shared/feature-flags";
import { getFlags } from "../../bridge/server";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export default class ModularDrawer {
  bottomSheetId = (component: string) => `bottom-sheet-${component}`;

  accountItem = "account-item";
  searchBarId = "modular-drawer-search-input";
  selectCryptoScrollViewId = "modular-drawer-select-crypto-scrollView";
  modularDrawerFlowViewId = "modular-drawer-flow-view";
  basedTitleIdMAD = `${this.bottomSheetId("header-title")}`;
  networkSelectionScrollViewId = "modular-drawer-network-selection-scrollView";

  assetScreenId = "Asset-screen";
  networkScreenId = "Network-screen";
  accountScreenId = "Account-screen";
  addNewOrExistingAccountButton = "add-new-account-button";
  drawerCloseButtonId = `${this.bottomSheetId("header-close-button")}`;
  drawerBackButtonId = `${this.bottomSheetId("header-back-button")}`;

  accountItemNameId = (name: string) => `account-item-name-${name}`;

  searchBar = () => getElementById(this.searchBarId);
  assetItemByTicker = (ticker: string) => new RegExp(`asset-item-${ticker}`, "i");
  networkItemIdMAD = (networkId: string) => new RegExp(`network-item-${networkId}`, "i");

  private flags: Features["llmModularDrawer"] | null = null;

  resetFlags(): void {
    this.flags = null;
  }

  private async loadFlags(): Promise<void> {
    this.flags ??= JSON.parse(await getFlags()).llmModularDrawer;
  }

  async isFlowEnabled<K extends keyof NonNullable<Features["llmModularDrawer"]["params"]>>(
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
    await waitForElement(getElementById(this.accountItem));
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
    if (await IsIdVisible(this.networkScreenId)) {
      await this.selectNetwork(networkName);
    }
  }

  @Step("Select network")
  async selectNetwork(networkName: string): Promise<void> {
    const id = this.networkItemIdMAD(networkName);
    if (!(await IsIdVisible(id))) {
      await getElementById(this.basedTitleIdMAD).swipe("up");
      await this.swipeToNetworkItem(id);
    }
    await tapById(id, 0);
  }

  private async swipeToNetworkItem(id: string | RegExp, maxAttempts = 5): Promise<void> {
    const scrollView = getElementById(this.networkSelectionScrollViewId);
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (await IsIdVisible(id)) return;
      await scrollView.swipe("up", "slow", 0.2, 0.5);
    }
  }

  @Step("Select currency in modular drawer")
  async selectAsset(account: Account): Promise<void> {
    await this.performSearchByTicker(account.currency.ticker);
    await this.selectCurrencyByTicker(account.currency.ticker);
    const networkName = this.getNetworkNameForAccount(account);
    await this.selectNetworkIfAsked(networkName);
    await this.selectFirstAccount();
  }

  @Step("Validate account(s) present on account list")
  async validateAccountsScreen(accounts?: string[]): Promise<void> {
    await waitForElement(getElementById(this.accountScreenId));
    jestExpect(await getTextOfElement(this.basedTitleIdMAD)).toMatch(/Select account.*/i);
    if (!accounts) {
      await detoxExpect(getElementById(this.accountItem)).not.toBeVisible();
      return;
    }
    for (const account of accounts) {
      const accountItemId = this.accountItemNameId(account);
      await detoxExpect(getElementById(accountItemId)).toBeVisible();
    }
  }

  @Step("Validate account name(s) visible on account list")
  async validateAccountNames(accounts: string[]): Promise<void> {
    for (const account of accounts) {
      const accountItemId = this.accountItemNameId(account);
      await detoxExpect(getElementById(accountItemId)).toBeVisible();
    }
  }

  @Step("Validate network(s) present on network list")
  async validateNetworksScreen(networks: string[]): Promise<void> {
    await waitForElement(getElementById(this.networkScreenId));
    jestExpect(await getTextOfElement(this.basedTitleIdMAD)).toMatch(/Select network.*/i);
    await getElementById(this.basedTitleIdMAD).swipe("up");
    for (const network of networks) {
      const networkItemId = this.networkItemIdMAD(network);
      await this.swipeToNetworkItem(networkItemId);
      await detoxExpect(getElementById(networkItemId)).toBeVisible();
    }
  }

  @Step("Validate assets present on account list")
  async validateAssetsScreen(assets: string[]): Promise<void> {
    await waitForElement(getElementById(this.assetScreenId));
    jestExpect(await getLabelOfElement(this.basedTitleIdMAD)).toMatch(/Select asset.*/i);
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
    await waitForElement(getElementById(this.basedTitleIdMAD));
    await detoxExpect(getElementById(this.basedTitleIdMAD)).toBeVisible();
    await detoxExpect(this.searchBar()).toBeVisible();
  }

  @Step("Tap on drawer close button")
  async tapDrawerCloseButton(options?: { onlyIfVisible: boolean }) {
    options = options ?? { onlyIfVisible: false };
    if (options.onlyIfVisible && !(await IsIdVisible(this.drawerCloseButtonId))) {
      return;
    }
    await waitForElement(getElementById(this.drawerCloseButtonId));
    await tapById(this.drawerCloseButtonId);
  }
}
