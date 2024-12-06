import { DeviceUSB, ModelId, getUSBDevice, knownDevices } from "../models/devices";
import {
  getElementById,
  getTextOfElement,
  launchProxy,
  scrollToId,
  tapByElement,
  tapById,
  typeTextByElement,
  waitForElementById,
} from "../helpers";
import { expect } from "detox";
import jestExpect from "expect";
import DeviceAction from "../models/DeviceAction";
import * as bridge from "../bridge/server";

import { launchSpeculos, deleteSpeculos } from "../helpers";
const proxyAddress = "localhost";

export default class CommonPage {
  searchBarId = "common-search-field";
  searchBar = () => getElementById(this.searchBarId);
  successCloseButtonId = "success-close-button";
  closeButton = () => getElementById("NavigationHeaderCloseButton");

  accoundCardId = (id: string) => "account-card-" + id;
  accountRowId = (accountId: string) => `account-row-${accountId}`;
  baseAccountName = "account-row-name-";
  accountNameRegExp = new RegExp(`${this.baseAccountName}.*`);

  addDeviceButton = () => getElementById("connect-with-bluetooth");
  scannedDeviceRow = (id: string) => `device-scanned-${id}`;
  pluggedDeviceRow = (nano: DeviceUSB) => `device-item-usb|${JSON.stringify(nano)}`;
  deviceRowRegex = /device-item-.*/;

  @Step("Perform search")
  async performSearch(text: string) {
    await waitForElementById(this.searchBarId);
    await typeTextByElement(this.searchBar(), text, false);
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

  async selectAccount(accountId: string) {
    const id = this.accoundCardId(accountId);
    await waitForElementById(id);
    await tapById(id);
  }

  @Step("Go to the account")
  async goToAccount(accountId: string) {
    await scrollToId(this.accountNameRegExp);
    await tapById(this.accountRowId(accountId));
  }

  @Step("Get the account name at index")
  async getAccountName(index = 0) {
    return await getTextOfElement(this.accountNameRegExp, index);
  }

  @Step("Expect the account name at index")
  async expectAccountName(accountName: string, index = 0) {
    jestExpect(await this.getAccountName(index)).toBe(accountName);
  }

  @Step("Go to the account with the name")
  async goToAccountByName(name: string) {
    await tapById(this.baseAccountName + name);
  }

  async selectAddDevice() {
    await tapByElement(this.addDeviceButton());
  }

  async addDeviceViaBluetooth(device = knownDevices.nanoX) {
    const deviceAction = new DeviceAction(device);
    await bridge.addDevicesBT(device);
    await waitForElementById(this.scannedDeviceRow(device.id));
    await tapById(this.scannedDeviceRow(device.id));
    await bridge.open();
    await deviceAction.waitForSpinner();
    await deviceAction.accessManager();
  }

  async addDeviceViaUSB(device: ModelId) {
    const nano = getUSBDevice(device);
    await bridge.addDevicesUSB(nano);
    await scrollToId(this.pluggedDeviceRow(nano));
    await waitForElementById(this.pluggedDeviceRow(nano));
    await tapById(this.pluggedDeviceRow(nano));
    await new DeviceAction(nano).accessManager();
  }

  async addSpeculos(nanoApp: string, speculosAddress = "localhost") {
    const proxyPort = await bridge.findFreePort();
    const speculosPort = await launchSpeculos(nanoApp, proxyPort);
    await launchProxy(proxyPort, speculosAddress, speculosPort);
    await bridge.addKnownSpeculos(`${proxyAddress}:${proxyPort}`);
    return proxyPort;
  }

  async removeSpeculos(proxyPort?: number) {
    await deleteSpeculos(proxyPort);
    proxyPort && (await bridge.removeKnownSpeculos(`${proxyAddress}:${proxyPort}`));
  }

  @Step("Select a known device")
  async selectKnownDevice(index = 0) {
    await tapById(this.deviceRowRegex, index);
  }
}
