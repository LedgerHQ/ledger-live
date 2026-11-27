import { Step } from "jest-allure2-reporter/api";
import { waitForIosTransitionEnd } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";

export default class SyncOfferPage {
  private readonly screen = byId("device-onboarding-sync-offer");
  private readonly activateButton = byId("device-onboarding-sync-offer-activate");
  private readonly skipButton = byId("device-onboarding-sync-offer-skip");
  private readonly quitButton = byId("device-onboarding-sync-offer-quit");

  @Step("Expect the Ledger Sync offer")
  async expectVisible() {
    await this.activateButton.waitVisible(TIMEOUT.xlarge);
  }

  @Step("Expect the Ledger Sync offer not to be shown")
  async expectNotShown() {
    await this.screen.expectNotVisible();
  }

  @Step("Expect the Ledger Sync offer to be gone")
  async expectClosed() {
    await this.screen.waitNotVisible();
  }

  @Step("Skip the Ledger Sync offer")
  async skip() {
    await waitForIosTransitionEnd();
    await this.skipButton.tap();
  }

  @Step("Close the Ledger Sync offer")
  async quit() {
    await waitForIosTransitionEnd();
    await this.quitButton.tap();
  }
}
