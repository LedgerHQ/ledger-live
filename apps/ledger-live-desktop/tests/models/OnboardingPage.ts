import { Page, Locator, expect } from "@playwright/test";
import { DeviceAction } from "./DeviceAction";

export class OnboardingPage {
  readonly page: Page;
  readonly deviceAction: DeviceAction;
  readonly getStartedButton: Locator;
  readonly selectDeviceContainer: Function;
  readonly selectDeviceButton: Function;
  readonly newDeviceButton: Locator;
  readonly connectDeviceButton: Locator;
  readonly restoreDeviceButton: Locator;
  readonly pedagogyModal: Locator;
  readonly stepperContinueButton: Locator;
  readonly stepperEndButton: Locator;
  readonly checkMyNanoButton: Locator;
  readonly continueButton: Locator;
  readonly leftArrowBasicsButton: Locator;
  readonly rightArrowBasicsButton: Locator;
  readonly tutorialContinueButton: Locator;
  readonly setupWalletButton: Locator;
  readonly getStartedCtaButton: Locator;
  readonly startSetupButton: Locator;
  readonly pinCodeCheckbox: Locator;
  readonly pinCodeDrawer: Locator;
  readonly recoveryPhraseCheckbox: Locator;
  readonly recoverySeedDrawer: Locator;
  readonly hideSeedDrawer: Locator;
  readonly recoveryPhraseLossCheckbox: Locator;
  readonly recoverySetupButton: Locator;
  readonly writeRecoveryPhraseButton: Locator;
  readonly confirmRecoveryPhraseButton: Locator;
  readonly hideRecoveryPhraseButton: Locator;
  readonly quizContainer: Locator;
  readonly quizStartButton: Locator;
  readonly quizAnswerTopButton: Locator;
  readonly quizAnswerBottomButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.deviceAction = new DeviceAction(page);
    this.getStartedButton = page.locator("data-test-id=v3-onboarding-get-started-button");
    this.selectDeviceContainer = (deviceId: string): Locator => {
      return page.locator(`data-test-id=v3-container-device-${deviceId}`);
    };
    this.selectDeviceButton = (deviceId: string): Locator =>
      page.locator(`data-test-id=v3-device-${deviceId}`);
    this.checkMyNanoButton = page.locator('button:has-text("Check my Nano")');
    this.continueButton = page.locator('button:has-text("Continue")');
    this.newDeviceButton = page.locator("data-test-id=v3-onboarding-new-device");
    this.connectDeviceButton = page.locator("data-test-id=v3-onboarding-initialized-device");
    this.restoreDeviceButton = page.locator("data-test-id=v3-onboarding-restore-device");
    this.pedagogyModal = page.locator("data-test-id=v3-onboarding-pedagogy-modal");
    this.stepperContinueButton = page.locator("data-test-id=v3-modal-stepper-continue");
    this.stepperEndButton = page.locator("data-test-id=v3-modal-stepper-end");
    this.leftArrowBasicsButton = page.locator("data-test-id=v3-pedagogy-left");
    this.rightArrowBasicsButton = page.locator("data-test-id=v3-pedagogy-right");
    this.tutorialContinueButton = page.locator("data-test-id=v3-tutorial-continue");
    this.setupWalletButton = page.locator("data-test-id=v3-setup-nano-wallet-cta");
    this.getStartedCtaButton = page.locator("data-test-id=v3-get-started-cta");
    this.startSetupButton = page.locator("data-test-id=v3-device-howto-cta");
    this.pinCodeCheckbox = page.locator("data-test-id=v3-private-pin-code-checkbox");
    this.pinCodeDrawer = page.locator("data-test-id=v3-pin-code-drawer");
    this.recoveryPhraseCheckbox = page.locator("data-test-id=v3-recovery-phrase-checkbox");
    this.recoveryPhraseLossCheckbox = page.locator("data-test-id=v3-recovery-phrase-loss-checkbox");
    this.recoverySeedDrawer = page.locator("data-test-id=v3-seed-drawer");
    this.hideSeedDrawer = page.locator("data-test-id=v3-hide-seed-drawer");
    this.recoverySetupButton = page.locator("data-test-id=v3-device-recoveryphrase-cta");
    this.writeRecoveryPhraseButton = page.locator("data-test-id=v3-use-recovery-sheet");
    this.confirmRecoveryPhraseButton = page.locator("data-test-id=v3-recovery-howto-3");
    this.hideRecoveryPhraseButton = page.locator("data-test-id=v3-hide-recovery-cta");
    this.quizContainer = page.locator("data-test-id=v3-quiz-container");
    this.quizStartButton = page.locator("data-test-id=v3-quiz-start-button");
    this.quizAnswerTopButton = page.locator("data-test-id=v3-quiz-answer-0");
    this.quizAnswerBottomButton = page.locator("data-test-id=v3-quiz-answer-1");
  }

  async getStarted() {
    await this.getStartedButton.waitFor({ state: "visible" });
    expect(await this.page.screenshot()).toMatchSnapshot("v3-get-started.png");
    await this.getStartedButton.click();
  }

  async selectDevice(device: "nanoS" | "nanoX" | "nanoSPlus") {
    expect(await this.page.screenshot()).toMatchSnapshot("v3-device-selection.png");
    await this.page.hover(`[data-test-id=v3-container-device-${device}]`);
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

  async startTutorial(group: string, nano: string) {
    expect(await this.page.screenshot()).toMatchSnapshot([group, "get-started-1.png"]);
    await this.continueTutorial();

    expect(
      await this.page.screenshot({
        mask: [this.page.locator("[role=animation]")],
      }),
    ).toMatchSnapshot([group, `get-started-2-${nano}.png`]);
    await this.continueTutorial();
  }

  async setPinCode(group: string, nano: string) {
    expect(await this.page.screenshot()).toMatchSnapshot([group, "pin-code-1.png"]);
    await this.acceptPrivatePinCode();

    expect(await this.page.screenshot()).toMatchSnapshot([group, "pin-code-2.png"]);
    await this.continueTutorial();

    expect(
      await this.page.screenshot({
        mask: [this.page.locator("[role=animation]")],
      }),
    ).toMatchSnapshot([group, `pin-code-3-${nano}.png`]);
    await this.continueTutorial();

    expect(
      await this.page.screenshot({
        mask: [this.page.locator("[role=animation]")],
      }),
    ).toMatchSnapshot([group, `pin-code-4-${nano}.png`]);
    await this.continuePinDrawer();
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
    expect(await this.page.screenshot()).toMatchSnapshot("v3-genuine-check.png");
    await this.checkMyNanoButton.click();
    expect(await this.page.screenshot()).toMatchSnapshot("v3-before-genuine-check.png");
  }

  async genuineCheck() {
    expect(await this.page.screenshot()).toMatchSnapshot("v3-genuine-checking.png");
    await this.deviceAction.genuineCheck();
    expect(await this.page.screenshot()).toMatchSnapshot("v3-genuine-check-done.png");
  }

  async continue() {
    await this.continueButton.click();
  }

  async reachApp() {
    await this.continue();
    await this.page.waitForTimeout(500);
    expect(await this.page.screenshot()).toMatchSnapshot("v3-onboarding-complete.png");
  }
}
