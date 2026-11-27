import { Step } from "jest-allure2-reporter/api";
import { waitForIosTransitionEnd } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";

/** The bottom sheet that details Recover after a new seed. */
export default class RecoverDetailsDrawer {
  private readonly content = byId("device-onboarding-recover-sheet-content");
  private readonly remindLaterButton = byId("device-onboarding-recover-sheet-remind");

  @Step("Expect the Recover details")
  async expectVisible() {
    await this.content.waitFullyVisible();
  }

  @Step("Remind me later from the Recover details")
  async remindLater() {
    await this.content.waitFullyVisible();
    await waitForIosTransitionEnd();
    await this.remindLaterButton.tap();
  }
}
