import { Step } from "jest-allure2-reporter/api";
import { byId } from "@e2e/helpers/elements/native";

/** The bottom sheet the device list opens while it waits for a tapped device. */
export default class DeviceStateDrawer {
  private readonly waitingForDeviceContent = byId(
    "connect-known-or-new-device-state-sheet-waiting-for-device",
  );

  @Step("Expect the device state sheet to wait for the device")
  async expectWaitingForDevice() {
    await this.waitingForDeviceContent.waitFullyVisible();
  }
}
