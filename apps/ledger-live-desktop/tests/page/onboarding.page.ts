import { DeviceAction } from "../models/DeviceAction";
import { AppPage } from "tests/page/abstractClasses";

export class OnboardingPage extends AppPage {
  deviceAction = new DeviceAction(this.page);
  private getStartedButton = this.page.locator("data-test-id=v3-onboarding-get-started-button");
  private selectDeviceButton = (deviceId: string) =>
    this.page.locator(`data-test-id=v3-device-${deviceId}`);
  private checkMyNanoButton = this.page.locator('button:has-text("Check my Nano")');
  private continueButton = this.page.locator('button:has-text("Continue")');
  private newDeviceButton = this.page.locator("data-test-id=v3-onboarding-new-device");
  private connectDeviceButton = this.page.locator("data-test-id=v3-onboarding-initialized-device");
  private restoreDeviceButton = this.page.locator("data-test-id=v3-onboarding-restore-device");
  readonly pedagogyModal = this.page.locator("data-test-id=v3-onboarding-pedagogy-modal");
  private stepperContinueButton = this.page.locator("data-test-id=v3-modal-stepper-continue");
  private stepperEndButton = this.page.locator("data-test-id=v3-modal-stepper-end");
  private tutorialContinueButton = this.page.locator("data-test-id=v3-tutorial-continue");
  private pinCodeCheckbox = this.page.locator("data-test-id=v3-private-pin-code-checkbox");
  private pinCodeDrawer = this.page.locator("data-test-id=v3-pin-code-drawer");
  private recoveryPhraseCheckbox = this.page.locator("data-test-id=v3-recovery-phrase-checkbox");
  private recoveryPhraseLossCheckbox = this.page.locator(
    "data-test-id=v3-recovery-phrase-loss-checkbox",
  );
  private recoverySeedDrawer = this.page.locator("data-test-id=v3-seed-drawer");
  private hideSeedDrawer = this.page.locator("data-test-id=v3-hide-seed-drawer");
  readonly quizContainer = this.page.locator("data-test-id=v3-quiz-container");
  private quizStartButton = this.page.locator("data-test-id=v3-quiz-start-button");
  private quizAnswerTopButton = this.page.locator("data-test-id=v3-quiz-answer-0");
  private quizAnswerBottomButton = this.page.locator("data-test-id=v3-quiz-answer-1");
  readonly roleAnimation = this.page.locator("[role=animation]");

  async waitForLaunch() {
    await this.getStartedButton.waitFor({ state: "visible" });
  }

  async waitForPedagogyModal() {
    await this.page.waitForSelector("data-test-id=v3-onboarding-pedagogy-modal");
  }

  async getStarted() {
    await this.getStartedButton.click();
  }

  async hoverDevice(device: "nanoS" | "nanoX" | "nanoSP" | "stax") {
    await this.page.hover(`[data-test-id=v3-container-device-${device}]`);
  }

  async selectDevice(device: "nanoS" | "nanoX" | "nanoSP" | "stax") {
    await this.hoverDevice(device);
    await this.selectDeviceButton(device).click();
  }

  async connectDevice() {
    await this.connectDeviceButton.click();
  }

  async newDevice() {
    await this.newDeviceButton.click();
  }

  async restoreDevice() {
    await this.restoreDeviceButton.click();
  }

  async pedagogyContinue() {
    await this.stepperContinueButton.click();
  }

  async pedagogyEnd() {
    await this.stepperEndButton.click();
  }

  async continuePinDrawer() {
    await this.pinCodeDrawer.click();
  }

  async continueRecoverySeedDrawer() {
    await this.recoverySeedDrawer.click();
  }

  async continueHideSeedDrawer() {
    await this.hideSeedDrawer.click();
  }

  async continueTutorial() {
    await this.tutorialContinueButton.click();
  }

  async acceptPrivatePinCode() {
    await this.pinCodeCheckbox.click();
  }

  async acceptRecoveryPhrase() {
    await this.recoveryPhraseCheckbox.click();
  }

  async acceptRecoveryPhraseLoss() {
    await this.recoveryPhraseLossCheckbox.click();
  }

  async startQuiz() {
    await this.quizStartButton.click();
  }

  async answerQuizTop() {
    await this.quizAnswerTopButton.click();
  }

  async answerQuizBottom() {
    await this.quizAnswerBottomButton.click();
  }

  async quizNextQuestion() {
    await this.stepperContinueButton.click();
  }

  async quizEnd() {
    await this.stepperEndButton.click();
  }

  async checkDevice() {
    await this.checkMyNanoButton.click();
  }

  async genuineCheck() {
    await this.deviceAction.genuineCheck();
  }

  async continue() {
    await this.continueButton.click();
  }

  async reachApp() {
    await this.continue();
    await this.page.waitForTimeout(500);
  }
}
