import { Step } from "jest-allure2-reporter/api";
import { waitForIosTransitionEnd } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";
import KaraokeAdvance from "./karaokeAdvance";

const RECOVER_PHRASE_COUNT = 3;

/** The Recover pitch shown after a new seed is set up. */
export default class RecoverNewSeedPage {
  private readonly screen = byId("device-onboarding-recover");
  private readonly karaoke = new KaraokeAdvance();
  private readonly protectButton = byId("device-onboarding-recover-protect");
  private readonly skipButton = byId("device-onboarding-recover-skip");

  @Step("Expect the Recover pitch")
  async expectVisible() {
    await this.screen.waitVisible(TIMEOUT.xxlarge);
  }

  @Step("Expect the Recover pitch to be gone")
  async expectClosed() {
    await this.screen.waitNotVisible();
  }

  @Step("Read the Recover pitch up to its offer")
  async readUntilOffer() {
    for (let phrase = 0; phrase < RECOVER_PHRASE_COUNT; phrase++) {
      await this.karaoke.advance();
    }
    await this.skipButton.waitVisible();
  }

  @Step("Skip the Recover offer")
  async skip() {
    await waitForIosTransitionEnd();
    await this.skipButton.tap();
  }

  @Step("Open the Recover details")
  async openDetails() {
    await waitForIosTransitionEnd();
    await this.protectButton.tap();
  }
}
