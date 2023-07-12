import { expect } from "detox";
import {
  getElementById,
  openDeeplink,
  tapByText,
  waitForElementById,
  waitForElementByText,
} from "../../helpers";
import * as bridge from "../../bridge/server";

const baseLink = "myledger";

export default class ManagerPage {
  proceedButtonId = "onboarding-paired-continue";
  getManagerTitle = () => getElementById("manager-title");
  getPairDeviceButton = () => getElementById("pair-device");
  getProceedButton = () => getElementById(this.proceedButtonId);
  waitProceedButton = () => waitForElementById(this.proceedButtonId);

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
