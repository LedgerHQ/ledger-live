import { element, by } from "detox";
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
    await detoxExpect(getElementById(this.managerTitleId)).toBeVisible();
  }

  async selectSetupNewDevice() {
    await tapByElement(this.setupNewDevice());
  }

  async selectConnectDevice() {
    await tapByElement(this.connectDevice());
  }

  async waitForDeviceInfoToLoad() {
    await waitForElementById(this.deviceNameId);
  }

  async checkDeviceName(name: string) {
    await detoxExpect(this.deviceName()).toHaveText(name);
  }
  async checkDeviceVersion(version: string) {
    await detoxExpect(this.deviceVersion()).toHaveText(`V ${version}`);
  }

  async checkDeviceAppsNStorage(appDesc: string[], installedDesc: string[]) {
    const installedAppNumber = installedDesc.length;
    const used = installedAppNumber * 4;
    await detoxExpect(this.storageLeftField()).toHaveText(this.storageLeftText(1.93 - used / 1000));
    await detoxExpect(this.storageUsedField()).toHaveText(this.storageUsedText(Math.floor(used)));

    await detoxExpect(this.installedAppField()).toHaveText(
      this.installedAppText(installedAppNumber),
    );
    const numberOutdated = installedDesc.filter(element => element.includes("(outdated)")).length;
    await detoxExpect(this.updateAppField()).toHaveText(this.updateAppText(numberOutdated));

    for (const app of appDesc) {
      const status = installedDesc.includes(app)
        ? "installed"
        : installedDesc.some(installedElement => installedElement.includes(app + " (outdated)"))
          ? "canUpdate"
          : "notInstalled";

      await scrollToId(this.appRow(app), this.deviceInfoScrollView);
      await detoxExpect(
        element(by.id(this.appRow(app)).withDescendant(by.id(this.appState(app, status)))),
      ).toBeVisible();
    }
  }
}
