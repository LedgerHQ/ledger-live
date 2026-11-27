import { Step } from "jest-allure2-reporter/api";
import { waitForIosTransitionEnd } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";

/** The bottom sheet that asks to confirm skipping Ledger Sync. */
export default class SkipSyncDrawer {
  private readonly confirmButton = byId("sync-onboarding-drawer-skipCTA");

  @Step("Confirm skipping Ledger Sync")
  async confirm() {
    await this.confirmButton.waitFullyVisible();
    await waitForIosTransitionEnd();
    await this.confirmButton.tap();
  }
}
