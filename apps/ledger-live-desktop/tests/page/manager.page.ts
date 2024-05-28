import { AppPage } from "tests/page/abstractClasses";

export class ManagerPage extends AppPage {
  private firmwareUpdateButton = this.page.locator("data-test-id=manager-update-firmware-button");
  private changeDeviceLanguageButton = this.page.locator(
    "data-test-id=manager-change-language-button",
  );
  private installedAppsTab = this.page.locator("data-test-id=manager-installed-apps-tab");
  private catalogAppsTab = this.page.locator("data-test-id=manager-app-catalog-tab");
  private updateAllButton = this.page.locator("data-test-id=manager-update-all-apps-button");
  private updateAllProgressBar = this.page.locator("data-test-id=manager-update-all-progress-bar");
  private changeLanguageOption = (language: string) =>
    this.page.locator(`data-test-id=manager-language-option-${language}`);
  private appProgressBar = (currency: string) =>
    this.page.locator(`data-test-id=manager-${currency}-app-progress-bar`);
  private installAppButton = (currency: string) =>
    this.page.locator(`data-test-id=manager-install-${currency}-app-button`);
  private uninstallAppButton = (currency: string) =>
    this.page.locator(`data-test-id=manager-uninstall-${currency}-app-button`);
  private uninstallAllAppsButton = this.page.locator(
    "data-test-id=manager-uninstall-all-apps-button",
  );
  private confirmButton = this.page.locator("data-test-id=modal-confirm-button");
  private installedAppEmptyState = this.page.locator("data-test-id=manager-no-apps-empty-state");
  private customImageButton = this.page.locator("data-test-id=manager-custom-image-button");

  async goToInstalledAppTab() {
    await this.installedAppsTab.click();
  }

  async goToCatalogTab() {
    await this.catalogAppsTab.click();
  }

  async updateAllApps() {
    await this.updateAllButton.click();
    await this.updateAllProgressBar.waitFor({ state: "detached" });
  }

  async installApp(currency: string) {
    await this.installAppButton(currency).click();
    await this.appProgressBar(currency).waitFor({ state: "detached" });
  }

  async openChangeLanguageDrawerAndSelectLanguage(language: string) {
    await this.changeDeviceLanguageButton.click();
    await this.changeLanguageOption(language).waitFor({ state: "visible" });
    await this.changeLanguageOption(language).click();
  }

  async uninstallApp(currency: string) {
    await this.uninstallAppButton(currency).click();
    await this.appProgressBar(currency).waitFor({ state: "detached" });
  }

  async uninstallAllApps() {
    await this.uninstallAllAppsButton.click();
    await this.confirmButton.click();
    await this.installedAppEmptyState.waitFor({ state: "visible" });
  }

  async waitForFirmwareUpdateButton() {
    await this.firmwareUpdateButton.waitFor({ state: "visible" });
  }

  async openFirmwareUpdateModal() {
    await this.firmwareUpdateButton.click();
  }

  async openCustomImage() {
    await this.waitForFirmwareUpdateButton(); // this avoids click jacking when the firmware update banner appears
    await this.customImageButton.click();
  }
}
