import { removeSpeculosAndDeregisterKnownSpeculos } from "../utils/speculosUtils";
import { Account, getParentAccountName } from "@ledgerhq/live-common/e2e/enum/Account";
import { isIos } from "../helpers/commonHelpers";
import { device } from "detox";

export default class CommonPage {
  searchBarId = "common-search-field";
  successViewDetailsButtonId = "success-view-details-button";
  proceedButtonId = "proceed-button";
  accountCardPrefix = "account-card-";
  accountItemId = "account-item-";
  accountItemNameRegExp = new RegExp(`${this.accountItemId}.*-name`);
  deviceItem = (deviceId: string): string => `device-item-${deviceId}`;
  deviceItemRegex = /device-item-.*/;
  walletApiWebview = "wallet-api-webview";

  searchBar = () => getElementById(this.searchBarId);
  closeButton = () => getElementById("NavigationHeaderCloseButton");
  backButton = () => getElementById("navigation-header-back-button");
  accountCardRegExp = (id = ".*") => new RegExp(this.accountCardPrefix + id);
  accountItemRegExp = (id = ".*(?<!-name)$") => new RegExp(`${this.accountItemId}${id}`);
  accountItem = (id: string) => getElementById(this.accountItemRegExp(id));
  accountItemName = (accountId: string) => getElementById(`${this.accountItemId + accountId}-name`);
  accountId = (account: Account) =>
    `test-id-account-${getParentAccountName(account)}${account.tokenType !== undefined ? ` (${account.currency.ticker})` : ""}`;

  @Step("Perform search")
  async performSearch(text: string) {
    await waitForElementById(this.searchBarId);
    await typeTextByElement(this.searchBar(), text);
  }

  @Step("Expect Search Bar to be visible")
  async expectSearchBarVisible() {
    await detoxExpect(this.searchBar()).toBeVisible();
  }

  @Step("Select currency to debit")
  async selectAccount(account: Account) {
    const accountId = this.accountId(account);
    await waitForElementById(accountId);
    await tapById(accountId);
  }

  @Step("Expect search")
  async expectSearch(text: string) {
    await detoxExpect(this.searchBar()).toHaveText(text);
  }

  @Step("Close page")
  async closePage() {
    await tapByElement(this.closeButton());
  }

  @Step("Go to previous page")
  async goToPreviousPage() {
    await tapByElement(this.backButton());
  }

  @Step("Tap on view details")
  async successViewDetails() {
    await waitForElementById(this.successViewDetailsButtonId);
    await tapById(this.successViewDetailsButtonId);
  }

  @Step("Select the first displayed account")
  async selectFirstAccount() {
    await tapById(this.accountCardRegExp());
  }

  @Step("Go to the account")
  async goToAccount(accountId: string) {
    await scrollToId(this.accountItemNameRegExp);
    await tapByElement(this.accountItem(accountId));
  }

  @Step("Check number of account rows: $0")
  async checkAccountRowNumber(nbr: number) {
    jestExpect(await countElementsById(this.accountItemNameRegExp)).toBeLessThanOrEqual(nbr);
  }

  @Step("Get the account name at index")
  async getAccountName(index = 0) {
    return await getTextOfElement(this.accountItemNameRegExp, index);
  }

  @Step("Expect the account name at index")
  async expectAccountName(accountName: string, index = 0) {
    jestExpect(await this.getAccountName(index)).toBe(accountName);
  }

  @Step("Go to the account with the name")
  async goToAccountByName(name: string) {
    const accountTitle = getElementByText(name);
    const rowId = (await getIdOfElement(accountTitle)).replace("-name", ""); // Workaround on iOS (name on top of the return arrow clickable layout)
    jestExpect(rowId).toContain(this.accountItemId);
    await tapById(rowId);
  }

  @Step("Remove Speculos")
  async removeSpeculos(deviceId?: string) {
    await removeSpeculosAndDeregisterKnownSpeculos(deviceId);
  }

  @Step("Select a known device")
  async selectKnownDevice(index = 0) {
    const proxyUrl = process.env.DEVICE_PROXY_URL;
    const elementId = proxyUrl ? this.deviceItem(`httpdebug|${proxyUrl}`) : this.deviceItemRegex;
    await waitForElementById(elementId);
    await tapById(elementId, proxyUrl ? undefined : index);
  }

  @Step("Tap proceed button")
  async tapProceedButton() {
    await tapById(this.proceedButtonId);
  }

  async disableSynchronizationForiOS() {
    if (isIos()) await device.disableSynchronization();
  }

  async enableSynchronization() {
    await device.enableSynchronization();
  }

  // Switching from webview to native view causes Detox issues. This workaround waits for a non existing element to flush detox queue
  async flushDetoxSyncQueue(): Promise<void> {
    try {
      await waitForElementById("__flush_queue__", 500);
    } catch {
      console.log("Intentional failure to flush detox queue");
    }
  }
}
