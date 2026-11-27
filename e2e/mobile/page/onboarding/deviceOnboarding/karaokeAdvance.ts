import { Step } from "jest-allure2-reporter/api";
import { waitForIosTransitionEnd } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";

const ABOVE_THE_PHRASES = { x: 40, y: 120 };

/** The full-screen tap area that moves every karaoke to its next phrase. */
export default class KaraokeAdvance {
  private readonly area = byId("karaoke-advance");

  @Step("Advance the karaoke to its next phrase")
  async advance() {
    await waitForIosTransitionEnd();
    await this.area.tapAt(ABOVE_THE_PHRASES);
  }
}
