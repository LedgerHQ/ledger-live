import {
  getElementById,
  openDeeplink,
  tapByText,
  waitForElementByID,
  waitForElementByText,
} from "../../helpers";
import { expect } from "detox";
import * as bridge from "../../bridge/server";

let proceedButtonId = "Proceed";
let baseLink: string = "myledger";

export default class ManagerPage {
  getManagerTitle = () => getElementById("manager-title");
  getPairDeviceButton = () => getElementById("pair-device");
  getProceedButton = () => getElementById(proceedButtonId);
  waitProceedButton = () => waitForElementByID(proceedButtonId);

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }

  async expectManagerPage() {
    await expect(this.getManagerTitle()).toBeVisible();
  }

  async addDevice(deviceName: string) {
    await this.expectManagerPage();
    await this.getPairDeviceButton().tap();
    bridge.addDevices();
    await waitForElementByText(deviceName, 3000);
    await tapByText(deviceName);
    bridge.setInstalledApps(); // tell LLM what apps the mock device has
    bridge.open();
    await this.waitProceedButton();
    await this.getProceedButton();
  }
}
