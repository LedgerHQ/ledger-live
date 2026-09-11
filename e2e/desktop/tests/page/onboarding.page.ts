import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import { DeviceModelId } from "@ledgerhq/types-devices";

export class OnboardingPage extends AppPage {
  private readonly getStartedButton = this.page.getByRole("button", { name: "Get Started" });
  private readonly welcomeTitle = this.page.getByTestId("onbording-welcome-title");
  private readonly deviceTile = (device: DeviceModelId) =>
    this.page.getByTestId(`v3-device-${device}`);
  private readonly deviceContainer = (device: DeviceModelId) =>
    this.page.getByTestId(`v3-container-device-${device}`);

  @step("Wait for the onboarding welcome screen")
  async waitForLaunch() {
    await expect(this.welcomeTitle).toBeVisible();
    await expect(this.getStartedButton).toBeVisible();
  }

  @step("Get started")
  async getStarted() {
    await this.getStartedButton.click();
  }

  @step("Select device $0")
  async selectDevice(device: DeviceModelId) {
    const tile = this.deviceTile(device);
    await expect(tile).toBeVisible();
    // The tile only becomes clickable while its container is hovered.
    await this.deviceContainer(device).hover();
    await tile.click();
  }
}
