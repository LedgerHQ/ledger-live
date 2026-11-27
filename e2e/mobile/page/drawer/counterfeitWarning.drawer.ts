import { Step } from "jest-allure2-reporter/api";
import { waitForIosTransitionEnd } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";

/** The bottom sheet that warns about counterfeit devices before the setup of a legacy Nano. */
export default class CounterfeitWarningDrawer {
  private readonly content = byId("counterfeit-warning-drawer-content");
  private readonly proceedButton = byId("counterfeit-warning-drawer-proceed");

  @Step("Expect the counterfeit warning")
  async expectVisible() {
    await this.content.waitFullyVisible();
  }

  @Step("Proceed from the counterfeit warning")
  async proceed() {
    await this.content.waitFullyVisible();
    await waitForIosTransitionEnd();
    await this.proceedButton.tap();
  }
}
