import { Step } from "jest-allure2-reporter/api";
import { waitForIosTransitionEnd } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";
import KaraokeAdvance from "./karaokeAdvance";

const INTRO_PHRASE_COUNT = 4;

export default class IntroKaraokePage {
  private readonly screen = byId("device-onboarding-karaoke");
  private readonly karaoke = new KaraokeAdvance();
  private readonly startButton = byId("device-onboarding-karaoke-action");

  @Step("Expect the intro karaoke")
  async expectVisible() {
    await this.screen.waitVisible(TIMEOUT.xlarge);
  }

  @Step("Read the intro karaoke up to its action")
  async readUntilAction() {
    for (let phrase = 1; phrase < INTRO_PHRASE_COUNT; phrase++) {
      await this.karaoke.advance();
    }
    await this.startButton.waitVisible();
  }

  @Step("Start the setup from the intro karaoke")
  async start() {
    await waitForIosTransitionEnd();
    await this.startButton.tap();
  }
}
