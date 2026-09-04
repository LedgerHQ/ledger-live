import { expect } from "@playwright/test";
import { AppPage } from "tests/page/abstractClasses";
import { step } from "tests/misc/reporters/step";

export type OnboardingDeviceModel = "nanoS" | "nanoSP" | "nanoX" | "stax" | "europa";

export class OnboardingPage extends AppPage {
  private getStartedButton = this.page.getByTestId("v3-onboarding-get-started-button");
  private welcomeTitle = this.page.getByTestId("onbording-welcome-title");
  private acceptAnalyticsButton = this.page.getByTestId("accept-analytics-button");
  private deviceContainer = (model: OnboardingDeviceModel) =>
    this.page.getByTestId(`v3-container-device-${model}`);
  private deviceButton = (model: OnboardingDeviceModel) =>
    this.page.getByTestId(`v3-device-${model}`);

  // The software check step of the sync onboarding carries no test ids, so it is
  // addressed by role and copy. Keys live under
  // `syncOnboarding.manual.softwareCheckContent` in the desktop translations.
  private startSoftwareCheckButton = this.page.getByRole("button", { name: /^Check Ledger / });
  private genuineCheckPassed = (deviceName: string) =>
    this.page.getByText(`${deviceName} is genuine`);
  private osUpToDate = this.page.getByText("Ledger OS is up to date");
  private continueToSetupButton = this.page.getByRole("button", { name: "Continue to setup" });
  private genuineCheckErrorDrawer = this.page.getByTestId("side-drawer-container");
  private genuineCheckFailed = (deviceName: string) =>
    this.page.getByText(`This ${deviceName} failed the Genuine Check`);

  @step("Wait for app to launch")
  async waitForLaunch() {
    await this.getStartedButton.waitFor({ state: "visible" });
    await this.welcomeTitle.waitFor({ state: "visible" });
  }

  @step("Click get started button")
  async clickGetStartedButton() {
    await this.getStartedButton.click();
    if (await this.acceptAnalyticsButton.isVisible()) {
      await this.acceptAnalyticsButton.click();
    }
  }

  @step("Select the $0 device")
  async selectDevice(model: OnboardingDeviceModel) {
    const container = this.deviceContainer(model);
    await container.waitFor({ state: "visible" });
    await container.scrollIntoViewIfNeeded();
    // The button only fades in once its container is hovered, and the
    // neighbouring cards overlap it, so both actions have to be forced.
    await container.hover({ force: true });
    await this.deviceButton(model).click({ force: true });
  }

  @step("Start the software check")
  async startSoftwareCheck() {
    await this.startSoftwareCheckButton.waitFor({ state: "visible" });
    await this.startSoftwareCheckButton.click();
  }

  @step("Expect the genuine check to pass")
  async expectGenuineCheckToPass(deviceName: string) {
    await expect(this.genuineCheckPassed(deviceName)).toBeVisible({ timeout: 60000 });
    await expect(this.osUpToDate).toBeVisible();
    await expect(this.continueToSetupButton).toBeEnabled();
    await expect(this.genuineCheckErrorDrawer).not.toBeVisible();
  }

  @step("Expect the genuine check to report the device as not genuine")
  async expectGenuineCheckToFail(deviceName: string) {
    await expect(this.genuineCheckFailed(deviceName)).toBeVisible({ timeout: 60000 });
    await expect(this.genuineCheckErrorDrawer).toBeVisible();
    await expect(this.page.getByText("It is not safe to use this Ledger device.")).toBeVisible();
    await expect(this.continueToSetupButton).not.toBeVisible();
  }
}
