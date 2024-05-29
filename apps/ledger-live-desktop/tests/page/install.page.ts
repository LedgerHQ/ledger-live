import { AppPage } from "tests/page/abstractClasses";

export class InstallSetOfApps extends AppPage {
  private debugInstallSetOfAppsButton = this.page.locator(
    "data-test-id=debug-install-set-of-apps-button",
  );
  private resetButton = this.page.locator("data-test-id=reset-button");
  private installCtaButton = this.page.locator("data-test-id=install-cta-button");
  private cancelCtaButton = this.page.locator("data-test-id=skip-cta-button");
  private inputOptionSelector = this.page.locator("data-test-id=input-option-selector");

  private circleProgressSelector = (circleProgress: string) =>
    this.page.locator(`circle[style="stroke-dashoffset: ${circleProgress};"]`);
  private installingText = this.page.locator("data-test-id=installing-text");

  async waitForLaunch() {
    await this.debugInstallSetOfAppsButton.waitFor({ state: "visible" });
  }

  async waitForDrawerIsOpen() {
    await this.installCtaButton.waitFor({ state: "visible" });
  }

  async accessDebugInstallSetOfApps() {
    await this.debugInstallSetOfAppsButton.dispatchEvent("click");
  }

  async startInstallOrRestoreSetOfApps() {
    await this.installCtaButton.click();
  }

  async skipInstallOrRestoreSetOfApps() {
    await this.cancelCtaButton.click();
  }

  async resetButtonClick() {
    await this.resetButton.click();
  }

  async startRestoreAppsFromStax() {
    await this.inputOptionSelector.click();
    await this.page.getByText("Restore from Ledger Stax").click();
  }

  async waitForCircleProgress(circleProgress: string) {
    await this.circleProgressSelector(circleProgress).waitFor({ state: "visible" });
  }

  async waitForInstallingTextToDisappear() {
    await this.installingText.waitFor({ state: "hidden" });
  }
}
