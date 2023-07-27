import { expect } from "detox";
import {
  getElementById,
  openDeeplink,
  tapByElement,
  tapByText,
  waitForElementById,
} from "../../helpers";
import { device } from "detox";
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
    await device.disableSynchronization(); // Scanning animation prevents launching mocks
    await tapByElement(this.getPairDeviceButton());
    bridge.addDevices();
    await device.enableSynchronization();
    await tapByText(deviceName);
    bridge.setInstalledApps(); // tell LLM what apps the mock device has
    bridge.open();
    await this.waitProceedButton();
    await this.getProceedButton();
  }
}
