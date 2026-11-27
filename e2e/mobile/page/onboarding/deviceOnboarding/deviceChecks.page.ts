import { Step } from "jest-allure2-reporter/api";
import { waitForIosTransitionEnd } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";

export default class DeviceChecksPage {
  private readonly screen = byId("device-onboarding-checks");
  private readonly startButton = byId("device-onboarding-checks-start");
  private readonly continueButton = byId("device-onboarding-checks-continue");
  private readonly quitButton = byId("device-onboarding-checks-quit");
  private readonly skipUpdateButton = byId("device-onboarding-checks-skip-update");

  @Step("Expect the checks screen waiting for start")
  async expectIdle() {
    await this.startButton.waitVisible(TIMEOUT.xlarge);
  }

  @Step("Start the checks")
  async start() {
    await waitForIosTransitionEnd();
    await this.startButton.tap();
  }

  @Step("Expect the checks to succeed")
  async expectSucceeded() {
    await this.continueButton.waitVisible(TIMEOUT.xxlarge);
  }

  @Step("Continue after the checks")
  async continueAfterSuccess() {
    await waitForIosTransitionEnd();
    await this.continueButton.tap();
  }

  @Step("Skip the firmware update")
  async skipFirmwareUpdate() {
    await waitForIosTransitionEnd();
    await this.skipUpdateButton.tap();
  }

  @Step("Close the checks screen")
  async quit() {
    await waitForIosTransitionEnd();
    await this.quitButton.tap();
  }

  @Step("Expect the checks screen to be gone")
  async expectClosed() {
    await this.screen.waitNotVisible();
  }
}
