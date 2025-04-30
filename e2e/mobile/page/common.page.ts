import { expect } from "detox";
import { deleteSpeculos, launchProxy, launchSpeculos } from "../utils/speculosUtils";
import { addKnownSpeculos, findFreePort, removeKnownSpeculos } from "../bridge/server";
import { unregisterAllTransportModules } from "@ledgerhq/live-common/hw";

const proxyAddress = "localhost";

export default class CommonPage {
  searchBarId = "common-search-field";
  searchBar = () => getElementById(this.searchBarId);
  successCloseButtonId = "success-close-button";
  successViewDetailsButtonId = "success-view-details-button";
  closeButton = () => getElementById("NavigationHeaderCloseButton");
  proceedButtonId = "proceed-button";

  accountCardPrefix = "account-card-";
  accountCardRegExp = (id = ".*") => new RegExp(this.accountCardPrefix + id);
  accountCardId = (id: string) => this.accountCardPrefix + id;

  accountItemId = "account-item-";
  accountItemRegExp = (id = ".*(?<!-name)$") => new RegExp(`${this.accountItemId}${id}`);
  accountItemNameRegExp = new RegExp(`${this.accountItemId}.*-name`);
  accountItem = (id: string) => getElementById(this.accountItemRegExp(id));
  accountItemName = (accountId: string) => getElementById(`${this.accountItemId + accountId}-name`);
  deviceRowRegex = /device-item-.*/;

  @Step("Perform search")
  async performSearch(text: string) {
    await waitForElementById(this.searchBarId);
    await typeTextByElement(await this.searchBar(), text);
  }

  @Step("Expect search")
  async expectSearch(text: string) {
    await expect(await this.searchBar()).toHaveText(text);
  }

  @Step("Close page")
  async closePage() {
    await tapByElement(await this.closeButton());
  }

  @Step("Tap on view details")
  async successViewDetails() {
    await waitForElementById(this.successViewDetailsButtonId);
    await tapById(this.successViewDetailsButtonId);
  }

  @Step("Select account")
  async selectAccount(accountId: string) {
    const id = this.accountCardId(accountId);
    await waitForElementById(id);
    await tapById(id);
  }

  @Step("Select the first displayed account")
  async selectFirstAccount() {
    await tapById(this.accountCardRegExp());
  }

  @Step("Go to the account")
  async goToAccount(accountId: string) {
    await scrollToId(this.accountItemNameRegExp);
    await tapByElement(await this.accountItem(accountId));
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
    const id = await getIdOfElement(await accountTitle);
    jestExpect(id).toContain(this.accountItemId);
    await tapByElement(await accountTitle);
  }

  async addSpeculos(nanoApp: string, speculosAddress = "localhost") {
    unregisterAllTransportModules();
    const proxyPort = await findFreePort();
    const speculosPort = await launchSpeculos(nanoApp);
    await launchProxy(proxyPort, speculosAddress, speculosPort);
    await addKnownSpeculos(`${proxyAddress}:${proxyPort}`);
    process.env.DEVICE_PROXY_URL = `ws://localhost:${proxyPort}`;
    CLI.registerSpeculosTransport(speculosPort.toString(), `http://${speculosAddress}`);
    return speculosPort;
  }

  async removeSpeculos(apiPort?: number) {
    const proxyPort = await deleteSpeculos(apiPort);
    proxyPort && (await removeKnownSpeculos(`${proxyAddress}:${proxyPort}`));
  }

  @Step("Select a known device")
  async selectKnownDevice(index = 0) {
    await tapById(this.deviceRowRegex, index);
  }
}
