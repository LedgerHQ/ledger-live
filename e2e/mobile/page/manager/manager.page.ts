import { expect, element, by } from "detox";
import { openDeeplink } from "../../helpers/commonHelpers";

export default class ManagerPage {
  baseLink = "myledger";
  managerTitleId = "manager-title";
  setupNewDevice = () => getElementById("manager_setup_new_device");
  connectDevice = () => getElementById("manager_connect_device");
  deviceNameId = "manager-device-name";
  deviceName = () => getElementById(this.deviceNameId);
  deviceVersion = () => getElementById("manager-device-version");
  storageLeftField = () => getElementById("manager-storage-available");
  installedAppField = () => getElementById("manager-installedApp-number");
  storageUsedField = () => getElementById("manager-storage-used");
  updateAppField = () => getElementById("manager-update-number");
  appRow = (appName: string) => `manager-app-row-${appName}`;
  appState = (appName: string, id: string) => `app-${appName}-${id}`;
  storageLeftText = (number: number) => `${number.toFixed(2)} Mb available`;
  installedAppText = (number: number) => `${number} apps`;
  storageUsedText = (value: number) => `Used ${value} Kb`;
  updateAppText = (number: number) => `${number} app update${number > 1 ? "s" : ""}`;
  deviceInfoScrollView = "manager-deviceInfo-scrollView";

  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  async expectManagerPage() {
    await expect(await getElementById(this.managerTitleId)).toBeVisible();
  }

  async selectSetupNewDevice() {
    await tapByElement(await this.setupNewDevice());
  }

  async selectConnectDevice() {
    await tapByElement(await this.connectDevice());
  }

  async waitForDeviceInfoToLoad() {
    await waitForElementById(this.deviceNameId);
  }

  async checkDeviceName(name: string) {
    await expect(await this.deviceName()).toHaveText(name);
  }

  async checkDeviceVersion(version: string) {
    await expect(await this.deviceVersion()).toHaveText(`V ${version}`);
  }

  async checkDeviceAppsNStorage(appDesc: string[], installedDesc: string[]) {
    const installedAppNumber = installedDesc.length;
    const used = installedAppNumber * 4;
    await expect(await this.storageLeftField()).toHaveText(
      this.storageLeftText(1.93 - used / 1000),
    );
    await expect(await this.storageUsedField()).toHaveText(this.storageUsedText(Math.floor(used)));

    await expect(await this.installedAppField()).toHaveText(
      this.installedAppText(installedAppNumber),
    );
    const numberOutdated = installedDesc.filter(element => element.includes("(outdated)")).length;
    await expect(await this.updateAppField()).toHaveText(this.updateAppText(numberOutdated));

    for (const app of appDesc) {
      const status = installedDesc.includes(app)
        ? "installed"
        : installedDesc.some(installedElement => installedElement.includes(app + " (outdated)"))
          ? "canUpdate"
          : "notInstalled";

      await scrollToId(this.appRow(app), this.deviceInfoScrollView);
      await expect(
        element(by.id(this.appRow(app)).withDescendant(by.id(this.appState(app, status)))),
      ).toBeVisible();
    }
  }
}
