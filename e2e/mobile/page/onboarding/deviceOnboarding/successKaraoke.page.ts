import { Step } from "jest-allure2-reporter/api";
import { waitForIosTransitionEnd } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";
import KaraokeAdvance from "./karaokeAdvance";

const SUCCESS_PHRASE_COUNT = 2;

/** The end of the unseeded funnel: a new seed ends it by itself, a restore ends it on a button. */
export default class SuccessKaraokePage {
  private readonly screen = byId("device-onboarding-success-karaoke");
  private readonly karaoke = new KaraokeAdvance();
  private readonly actionButton = byId("device-onboarding-success-karaoke-action");

  @Step("Expect the success karaoke")
  async expectVisible() {
    await this.screen.waitVisible(TIMEOUT.xxlarge);
  }

  @Step("Read the success karaoke of a new seed to its end")
  async readToEnd() {
    for (let phrase = 0; phrase < SUCCESS_PHRASE_COUNT; phrase++) {
      await this.karaoke.advance();
    }
  }

  @Step("Read the success karaoke of a restore and tap its action")
  async finishFromAction() {
    for (let phrase = 1; phrase < SUCCESS_PHRASE_COUNT; phrase++) {
      await this.karaoke.advance();
    }
    await this.actionButton.waitVisible();
    await waitForIosTransitionEnd();
    await this.actionButton.tap();
  }
}
