import { Step } from "jest-allure2-reporter/api";
import { waitForIosTransitionEnd } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";

/** The screen that explains how to restore a device from a Recover backup. */
export default class RecoverRestorePage {
  private readonly screen = byId("device-onboarding-recover-restore");
  private readonly closeButton = byId("device-onboarding-recover-restore-close");

  @Step("Expect the Recover restore screen")
  async expectVisible() {
    await this.screen.waitVisible(TIMEOUT.xxlarge);
  }

  @Step("Expect the Recover restore screen to be gone")
  async expectClosed() {
    await this.screen.waitNotVisible();
  }

  @Step("Close the Recover restore screen")
  async close() {
    await waitForIosTransitionEnd();
    await this.closeButton.tap();
  }
}
