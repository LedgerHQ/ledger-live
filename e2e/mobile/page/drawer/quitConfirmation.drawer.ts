import { Step } from "jest-allure2-reporter/api";
import { waitForIosTransitionEnd } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";

/** The bottom sheet that asks to confirm leaving the device onboarding. */
export default class QuitConfirmationDrawer {
  private readonly leaveButton = byId("device-onboarding-quit-confirmation-leave");

  @Step("Leave from the quit confirmation")
  async leave() {
    await this.leaveButton.waitFullyVisible();
    await waitForIosTransitionEnd();
    await this.leaveButton.tap();
  }
}
