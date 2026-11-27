import { Step } from "jest-allure2-reporter/api";
import { byId } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";

export type SetupStage = "checks" | "pin" | "setupChoice" | "security" | "restore";

/** The Setup screen of the unseeded funnel: the genuine check, then the steps done on the device. */
export default class SetupPage {
  private readonly stageSuccess = byId("device-onboarding-setup-stage-success");
  private readonly recoveryPhraseRestoreDescription = byId(
    "device-onboarding-setup-stage-description-restore-recoveryPhrase",
  );
  private readonly stageTitle = (stage: SetupStage) =>
    byId(`device-onboarding-setup-stage-title-${stage}`);

  @Step("Expect the checks of the Setup screen to succeed")
  async expectChecksSucceeded() {
    await this.stageSuccess.waitVisible(TIMEOUT.xxlarge);
  }

  @Step("Expect the Setup screen to show the {{0}} stage")
  async expectStage(stage: SetupStage) {
    await this.stageTitle(stage).waitVisible(TIMEOUT.xxlarge);
  }

  @Step("Expect the Setup screen to ask for the recovery phrase")
  async expectRecoveryPhraseRestore() {
    await this.recoveryPhraseRestoreDescription.waitVisible(TIMEOUT.xxlarge);
  }
}
