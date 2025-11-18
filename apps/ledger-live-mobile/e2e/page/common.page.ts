import { DeviceUSB, ModelId, getUSBDevice, knownDevices } from "../models/devices";
import { expect } from "detox";
import DeviceAction from "../models/DeviceAction";
import { open, addDevicesBT, addDevicesUSB } from "../bridge/server";

export default class CommonPage {
  searchBarId = "common-search-field";
  searchBar = () => getElementById(this.searchBarId);
  successCloseButtonId = "success-close-button";
  closeButton = () => getElementById("NavigationHeaderCloseButton");

  accountCardPrefix = "account-card-";
  accountCardId = (id: string) => this.accountCardPrefix + id;

  accountItemId = "account-item-";
  accountItemRegExp = (id = ".*(?<!-name)$") => new RegExp(`${this.accountItemId}${id}`);
  accountItem = (id: string) => getElementById(this.accountItemRegExp(id));
  accountItemName = (accountId: string) => getElementById(`${this.accountItemId + accountId}-name`);

  addDeviceButton = () => getElementById("connect-with-bluetooth");
  scannedDeviceRow = (id: string) => `device-scanned-${id}`;
  pluggedDeviceRow = (nano: DeviceUSB) => `device-item-usb|${JSON.stringify(nano)}`;
  blePairingLoadingId = "ble-pairing-loading";

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

  async selectAccount(accountId: string) {
    const id = this.accountCardId(accountId);
    await waitForElementById(id);
    await tapById(id);
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
    await waitForElementById(this.pluggedDeviceRow(nano));
    await scrollToId(this.pluggedDeviceRow(nano));
    await tapById(this.pluggedDeviceRow(nano));
    await new DeviceAction(nano).accessManager();
  }
}
