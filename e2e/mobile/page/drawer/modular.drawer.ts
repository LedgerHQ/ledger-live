import { Step } from "jest-allure2-reporter/api";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { byId, byIdWithDescendantText } from "@e2e/helpers/elements/native";

export default class ModularDrawer {
  private readonly accountItem = byId("account-item");
  private readonly searchBar = byId("modular-drawer-search-input");
  private readonly selectCryptoScrollView = byId("modular-drawer-select-crypto-scrollView");
  private readonly networkSelectionScrollView = byId("modular-drawer-network-selection-scrollView");
  private readonly assetScreen = byId("Asset-screen");
  private readonly accountScreen = byId("Account-screen");
  private readonly networkScreen = byId("Network-screen");
  private readonly addNewOrExistingAccountButton = byId("add-new-account-button");
  private readonly sheetTitle = byId("bottom-sheet-header-title");
  private readonly drawerCloseButton = byId("bottom-sheet-header-close-button");
  private readonly drawerBackButton = byId("bottom-sheet-header-back-button");
  private readonly accountItemName = (name: string) => byId(`account-item-name-${name}`);
  private readonly assetItem = (ticker: string) => byId(new RegExp(`asset-item-${ticker}`, "i"));
  private readonly assetItemWithText = (assetItemId: string, text: RegExp) =>
    byIdWithDescendantText({ id: assetItemId, text });
  private readonly networkItem = (networkId: string) =>
    byId(new RegExp(`network-item-${networkId}`, "i"));

  getNetworkNameForAccount(account: Account): string {
    return account?.parentAccount === undefined
      ? account.currency.speculosApp.name
      : account?.parentAccount?.currency.name;
  }

  @Step("Select first account in modular drawer")
  async selectFirstAccount() {
    await this.accountItem.tap();
  }

  @Step("Select first account in modular drawer if asked")
  async selectFirstAccountIfAsked(): Promise<void> {
    if (await this.accountScreen.isVisible()) {
      await this.selectFirstAccount();
    }
  }

  @Step("Select Account {{{0}}}")
  async selectAccount(accountName: string): Promise<void> {
    await this.accountItemName(accountName).tap();
  }

  @Step("Tap on drawer back button")
  async tapDrawerBackButton() {
    await this.drawerBackButton.tap();
  }

  @Step("Validate account(s) present on account list {{{0}}}")
  async validateNumberOfAccounts(expectedCount: number) {
    jestExpect(await this.accountItem.count()).toBe(expectedCount);
  }

  @Step("Perform search on modular drawer by ticker {{{0}}}")
  async performSearchByTicker(ticker: string) {
    await this.searchBar.replaceText(ticker);
  }

  @Step("Perform search on modular drawer by ticker {{{0}}}, keeping the keyboard open")
  async performSearchByTickerKeepKeyboard(ticker: string) {
    await this.searchBar.replaceTextKeepKeyboard(ticker);
  }

  @Step("Select currency in receive list by ticker {{{0}}}")
  async selectCurrencyByTicker(ticker: string): Promise<void> {
    const assetItem = this.assetItem(ticker);
    if (!(await assetItem.isVisible())) {
      await this.performSearchByTicker(ticker);
      await assetItem.scrollTo(this.selectCryptoScrollView);
    }
    await assetItem.tap();
  }

  @Step("Check asset {{{0}}} amount is masked in discreet mode")
  private async checkAssetAmountIsDiscreet(ticker: string): Promise<void> {
    await this.performSearchByTicker(ticker);
    await this.assetItem(ticker).waitVisible();
    await this.assetItem(ticker).expectVisible();

    // The pattern can match several rows: check both masks on the first one.
    const assetItemId = await this.assetItem(ticker).getIdentifier();
    await this.assetItemWithText(assetItemId, /\$\*\*\*/).expectVisible();
    await this.assetItemWithText(
      assetItemId,
      new RegExp(String.raw`\*\*\*\s+${ticker}`, "i"),
    ).expectVisible();
  }

  @Step("Check listed asset amounts are masked in discreet mode {{{0}}}")
  async checkAssetAmountsAreDiscreet(tickers: string[]): Promise<void> {
    for (const ticker of tickers) {
      await this.checkAssetAmountIsDiscreet(ticker);
    }
  }

  @Step("Select network in list if needed {{{0}}}")
  async selectNetworkIfAsked(networkName: string): Promise<void> {
    if (await this.networkScreen.isVisible()) {
      await this.selectNetwork(networkName);
    }
  }

  @Step("Select network {{{0}}}")
  async selectNetwork(networkName: string): Promise<void> {
    const networkItem = this.networkItem(networkName);
    if (!(await networkItem.isVisible())) {
      await this.sheetTitle.swipe("up");
      await networkItem.revealForTap(this.networkSelectionScrollView);
    }
    await networkItem.tap();
  }

  private async selectAssetCurrencyAndNetwork(account: Account): Promise<void> {
    await this.selectCurrencyByTicker(account.currency.ticker);
    const networkName = this.getNetworkNameForAccount(account);
    await this.selectNetworkIfAsked(networkName);
  }

  @Step("Select currency in modular drawer {{{0.accountName}}}")
  async selectAsset(account: Account): Promise<void> {
    await this.selectAssetCurrencyAndNetwork(account);
    await this.selectFirstAccount();
  }

  @Step("Select currency then a specific account in modular drawer {{{0.accountName}}}")
  async selectAssetAndAccount(account: Account): Promise<void> {
    await this.selectAssetCurrencyAndNetwork(account);
    // Token accounts are listed under their PARENT account's name in the drawer
    // (useDetailedAccountsCore: name = parentAccountName ?? token name), so pin by parent.
    const accountName = account.parentAccount?.accountName ?? account.accountName;
    await this.selectAccount(accountName);
  }

  @Step("Validate account(s) present on account list {{{0}}}")
  async validateAccountsScreen(accounts?: string[]): Promise<void> {
    await this.accountScreen.waitVisible();
    await this.sheetTitle.expectTextMatching(/Select account.*/i);
    if (!accounts) {
      await this.accountItem.expectNotVisible();
      return;
    }
    for (const account of accounts) {
      await this.accountItemName(account).expectVisible();
    }
  }

  @Step("Validate account name(s) visible on account list {{{0}}}")
  async validateAccountNames(accounts: string[]): Promise<void> {
    for (const account of accounts) {
      await this.accountItemName(account).expectVisible();
    }
  }

  @Step("Validate network(s) present on network list {{{0}}}")
  async validateNetworksScreen(networks: string[]): Promise<void> {
    await this.networkScreen.waitVisible();
    await this.sheetTitle.expectTextMatching(/Select network.*/i);
    await this.sheetTitle.swipe("up");
    for (const network of networks) {
      await this.networkItem(network).scrollTo(this.networkSelectionScrollView);
      await this.networkItem(network).expectVisible();
    }
  }

  @Step("Validate assets present on account list {{{0}}}")
  async validateAssetsScreen(assets: string[]): Promise<void> {
    await this.assetScreen.waitVisible();
    await this.sheetTitle.expectLabelMatching(/Select asset.*/i);
    await this.sheetTitle.swipe("up");
    for (const asset of assets) {
      await this.assetItem(asset).expectVisible();
    }
  }

  @Step("Tap on add new or existing account button")
  async tapAddNewOrExistingAccountButtonMAD(): Promise<void> {
    await this.addNewOrExistingAccountButton.tap();
  }

  @Step("Expect (Select Asset) page")
  async checkSelectAssetPage() {
    await this.sheetTitle.waitVisible();
    await this.sheetTitle.expectVisible();
    await this.searchBar.expectVisible();
  }

  @Step("Tap on drawer close button")
  async tapDrawerCloseButton(options?: { onlyIfVisible: boolean }) {
    if (options?.onlyIfVisible && !(await this.drawerCloseButton.isVisible())) {
      return;
    }
    await this.drawerCloseButton.tap();
  }

  // iOS counts a view flush with the sheet edge as hidden
  // wait on the inset search field instead of the container
  @Step("Wait for modular drawer search bar")
  async waitForSearchBar() {
    await this.searchBar.waitFullyVisible();
  }
}
