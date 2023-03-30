import { Page, Locator } from "@playwright/test";

export class InstallSetOfApps {
  readonly page: Page;
  readonly debugInstallSetOfAppsButton: Locator;
  readonly resetButton: Locator;
  readonly installCtaButton: Locator;
  readonly cancelCtaButton: Locator;
  readonly inputOptionSelector: Locator;
  readonly circleProgressSelector: (circleProgress: string) => Locator;
  readonly installingText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.debugInstallSetOfAppsButton = page.locator(
      "data-test-id=debug-install-set-of-apps-button",
    );
    this.resetButton = page.locator("data-test-id=reset-button");
    this.installCtaButton = page.locator("data-test-id=install-cta-button");
    this.cancelCtaButton = page.locator("data-test-id=skip-cta-button");
    this.inputOptionSelector = page.locator("data-test-id=input-option-selector");

    this.circleProgressSelector = circleProgress =>
      page.locator(`circle[style="stroke-dashoffset: ${circleProgress};"]`);
    this.installingText = page.locator("data-test-id=installing-text");
  }

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
