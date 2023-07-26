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
  managerTitle = () => getElementById("manager-title");
  pairDeviceButton = () => getElementById("pair-device");

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }

  async expectManagerPage() {
    await expect(this.managerTitle()).toBeVisible();
  }

  async addDevice(deviceName: string) {
    await this.expectManagerPage();
    await device.disableSynchronization(); // Scanning animation prevents launching mocks
    await tapByElement(this.pairDeviceButton());
    bridge.addDevices();
    await device.enableSynchronization();
    await tapByText(deviceName);
    bridge.setInstalledApps(); // tell LLM what apps the mock device has
    bridge.open();
    await waitForElementById("onboarding-paired-continue");
  }
}
