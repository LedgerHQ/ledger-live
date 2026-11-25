import { Step } from "jest-allure2-reporter/api";
import { byId, byIdWithDescendantText } from "@e2e/helpers/elements/native";
import DeviceStateDrawer from "@e2e/page/drawer/deviceState.drawer";
import ConnectDevicePage from "@e2e/page/onboarding/deviceOnboarding/connectDevice.page";

type DeviceStatusOptions = {
  deviceKey: string;
  statusLabel: string;
};

/** The device list of My Wallet. A device key is the key the app gives its row. */
export default class DeviceListPage {
  addMode = new ConnectDevicePage();
  stateDrawer = new DeviceStateDrawer();

  private readonly addDeviceRow = byId("connect-known-or-new-device-add-device");
  private readonly addModeCloseButton = byId("connect-known-or-new-device-add-mode-close");
  private readonly deviceRow = (deviceKey: string) =>
    byId(`connect-known-or-new-device-row-${deviceKey}`);
  private readonly deviceStatus = (deviceKey: string, statusLabel: string) =>
    byIdWithDescendantText({
      id: `connect-known-or-new-device-row-${deviceKey}-status`,
      text: statusLabel,
    });

  @Step("Expect the device {{0.deviceKey}} to show the status {{0.statusLabel}}")
  async expectDeviceStatus({ deviceKey, statusLabel }: DeviceStatusOptions) {
    await this.deviceStatus(deviceKey, statusLabel).waitVisible();
  }

  @Step("Open the Add mode from the empty list")
  async openAddModeFromEmptyList() {
    await this.addDeviceRow.tap();
    await this.addModeCloseButton.waitVisible();
  }

  @Step("Add the discovered device and open My Ledger")
  async addDeviceAndOpenMyLedger() {
    await this.addMode.expectDeviceListed();
    await this.addMode.selectDevice();
    await app.manager.expectDeviceInfoVisible();
  }

  @Step("Open My Ledger from the device {{0}}")
  async openMyLedger(deviceKey: string) {
    await this.deviceRow(deviceKey).tap();
    await app.manager.expectDeviceInfoVisible();
  }

  @Step("Tap the device {{0}} and wait for it")
  async waitForDevice(deviceKey: string) {
    await this.deviceRow(deviceKey).tap();
    await this.stateDrawer.expectWaitingForDevice();
  }
}
