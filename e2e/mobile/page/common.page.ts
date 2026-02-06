import { Step } from "jest-allure2-reporter/api";
import { removeSpeculosAndDeregisterKnownSpeculos } from "../utils/speculosUtils";
import { Account, getParentAccountName } from "@ledgerhq/live-common/e2e/enum/Account";
import { delay, isIos } from "../helpers/commonHelpers";
import { device } from "detox";
import ErrorPage from "./error.page";

export default class CommonPage {
  assetScreenFlatlistId = "asset-screen-flatlist";
  searchBarId = "common-search-field";
  successViewDetailsButtonId = "success-view-details-button";
  validateSuccessScreenId = "validate-success-screen";
  proceedButtonId = "proceed-button";
  accountCardPrefix = "account-card-";
  accountItemId = "account-item-";
  accountItemNameRegExp = new RegExp(`${this.accountItemId}.*-name`);
  deviceItem = (deviceId: string): string => `device-item-${deviceId}`;
  deviceItemRegex = /device-item-.*/;
  walletApiWebview = "wallet-api-webview";
  closeWithConfirmationButtonId = "button-close-add-account";
  errorPage = new ErrorPage();

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
    await waitForElementById(this.validateSuccessScreenId);
    await waitForElementById(this.successViewDetailsButtonId);
    await delay(1000);
    await tapById(this.successViewDetailsButtonId);
  }

  @Step("Select the first displayed account")
  async selectFirstAccount() {
    await tapById(this.accountCardRegExp());
  }

  @Step("Go to the account")
  async goToAccount(accountId: string) {
    await scrollToId(this.accountItemRegExp(accountId), this.assetScreenFlatlistId);
    await tapByElement(this.accountItem(accountId));
  }

  @Step("Tap on close with confirmation button")
  async tapCloseWithConfirmationButton() {
    await waitForElementById(this.closeWithConfirmationButtonId);
    await tapById(this.closeWithConfirmationButtonId);
  }

  @Step("Check number of account rows")
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
}
