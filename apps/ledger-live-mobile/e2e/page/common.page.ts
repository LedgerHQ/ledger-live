import { DeviceUSB, ModelId, getUSBDevice, knownDevices } from "../models/devices";
import { expect } from "detox";
import { launchProxy } from "../utils/speculosUtils";
import DeviceAction from "../models/DeviceAction";
import {
  open,
  addDevicesBT,
  addDevicesUSB,
  addKnownSpeculos,
  removeKnownSpeculos,
  findFreePort,
} from "../bridge/server";
import { unregisterAllTransportModules } from "@ledgerhq/live-common/hw/index";
import { launchSpeculos, deleteSpeculos } from "../utils/speculosUtils";

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
  accountCard = (id: string) => getElementById(this.accountCardRegExp(id));

  accountItemId = "account-item-";
  accountItemRegExp = (id = ".*(?<!-name)$") => new RegExp(`${this.accountItemId}${id}`);
  accountItemNameRegExp = new RegExp(`${this.accountItemId}.*-name`);
  accountItem = (id: string) => getElementById(this.accountItemRegExp(id));
  accountItemName = (accountId: string) => getElementById(`${this.accountItemId + accountId}-name`);

  addDeviceButton = () => getElementById("connect-with-bluetooth");
  scannedDeviceRow = (id: string) => `device-scanned-${id}`;
  pluggedDeviceRow = (nano: DeviceUSB) => `device-item-usb|${JSON.stringify(nano)}`;
  blePairingLoadingId = "ble-pairing-loading";
  deviceRowRegex = /device-item-.*/;

  @Step("Perform search")
  async performSearch(text: string) {
    await waitForElementById(this.searchBarId);
    await typeTextByElement(this.searchBar(), text);
  }

  async expectSearch(text: string) {
    await expect(this.searchBar()).toHaveText(text);
  }

  async closePage() {
    await tapByElement(this.closeButton());
  }

  async successClose() {
    await waitForElementById(this.successCloseButtonId);
    await tapById(this.successCloseButtonId);
  }

  @Step("Tap on view details")
  async successViewDetails() {
    await waitForElementById(this.successViewDetailsButtonId);
    await tapById(this.successViewDetailsButtonId);
  }

  async selectAccount(accountId: string) {
    const id = this.accountCardId(accountId);
    await waitForElementById(id);
    await tapById(id);
  }

  @Step("Select the first displayed account")
  async selectFirstAccount() {
    await tapById(this.accountCardRegExp());
  }

  async getAccountId(index: number) {
    return (await getIdByRegexp(this.accountCardRegExp(), index)).replace(
      this.accountCardPrefix,
      "",
    );
  }

  @Step("Go to the account")
  async goToAccount(accountId: string) {
    await scrollToId(this.accountItemNameRegExp);
    await tapByElement(this.accountItem(accountId));
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
    const id = await getIdOfElement(accountTitle);
    jestExpect(id).toContain(this.accountItemId);
    await tapByElement(accountTitle);
  }

  async selectAddDevice() {
    await tapByElement(this.addDeviceButton());
  }

  async addDeviceViaBluetooth(device = knownDevices.nanoX) {
    const deviceAction = new DeviceAction(device);
    await addDevicesBT(device);
    await waitForElementById(this.scannedDeviceRow(device.id));
    await tapById(this.scannedDeviceRow(device.id));
    await waitForElementById(this.blePairingLoadingId);
    await open();
    await deviceAction.accessManager();
  }

  async addDeviceViaUSB(device: ModelId) {
    const nano = getUSBDevice(device);
    await addDevicesUSB(nano);
    await scrollToId(this.pluggedDeviceRow(nano));
    await waitForElementById(this.pluggedDeviceRow(nano));
    await tapById(this.pluggedDeviceRow(nano));
    await new DeviceAction(nano).accessManager();
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
