import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import { DeviceModelId } from "@ledgerhq/types-devices";

const MAX_PEDAGOGY_SCREENS = 10;
const SELECTABLE_DEVICES = [
  DeviceModelId.stax,
  DeviceModelId.europa,
  DeviceModelId.nanoS,
  DeviceModelId.nanoSP,
  DeviceModelId.nanoX,
  DeviceModelId.apex,
];

type TutorialScreen =
  | "how-to-get-started"
  | "device-how-to"
  | "pin-code"
  | "pin-code-how-to"
  | "new-recovery-phrase"
  | "use-recovery-sheet"
  | "recovery-how-to-3"
  | "hide-recovery-phrase"
  | "quiz-success"
  | "pair-my-nano"
  | "genuine-check"
  | "enable-sync"
  | "secure-your-crypto"
  | "welcome-to-wallet-without-funds";

export class OnboardingPage extends AppPage {
  private readonly getStartedButton = this.page.getByRole("button", { name: "Get Started" });
  private readonly welcomeTitle = this.page.getByTestId("onbording-welcome-title");
  private readonly acceptAnalyticsButton = this.page.getByTestId(
    "analytics-opt-in-screen-accept-all",
  );
  private readonly deviceTile = (device: DeviceModelId) =>
    this.page.getByTestId(`v3-device-${device}`);
  private readonly setupNewDeviceOption = this.page.getByTestId("v3-onboarding-new-device");
  private readonly pedagogyModal = this.page.getByTestId("v3-onboarding-pedagogy-modal");
  private readonly stepperContinue = this.page.getByTestId("v3-modal-stepper-continue");
  private readonly stepperEnd = this.page.getByTestId("v3-modal-stepper-end");
  private readonly tutorialContinueOnAnyScreen = this.page.getByTestId(
    /^v3-tutorial-continue-(?!secondary-)/,
  );
  private readonly tutorialContinueOn = (screen: TutorialScreen) =>
    this.page.getByTestId(`v3-tutorial-continue-${screen}`);
  private readonly tutorialContinueSecondaryOn = (screen: TutorialScreen) =>
    this.page.getByTestId(`v3-tutorial-continue-secondary-${screen}`);
  private readonly pinCodeCheckbox = this.page.getByTestId("v3-private-pin-code-checkbox");
  private readonly pinCodeDrawerNext = this.page.getByTestId("v3-pin-code-drawer");
  private readonly recoveryPhraseCheckbox = this.page.getByTestId("v3-recovery-phrase-checkbox");
  private readonly recoverySeedDrawerNext = this.page.getByTestId("v3-seed-drawer");
  private readonly hideSeedDrawerNext = this.page.getByTestId("v3-hide-seed-drawer");
  private readonly quizStartButton = this.page.getByTestId("v3-quiz-start-button");
  private readonly quizAnswerTop = this.page.getByTestId("v3-quiz-answer-0");
  private readonly quizAnswerBottom = this.page.getByTestId("v3-quiz-answer-1");
  private readonly renderError = this.page.getByTestId("render-error");
  private readonly deviceContainer = (device: DeviceModelId) =>
    this.page.getByTestId(`v3-container-device-${device}`);

  @step("Wait for the onboarding welcome screen")
  async waitForLaunch() {
    await expect(this.welcomeTitle).toBeVisible();
    await expect(this.getStartedButton).toBeVisible();
  }

  @step("Get started")
  async getStarted() {
    await this.getStartedButton.click();
  }

  @step("Accept analytics in the opt-in screen")
  async acceptAnalytics() {
    await this.acceptAnalyticsButton.click();
  }

  @step("Expect the device selection screen")
  async expectDeviceSelectionScreen() {
    await expect(this.page).toHaveURL(/\/onboarding\/select-device$/);
  }

  @step("Expect a card for each selectable device")
  async expectDeviceCards() {
    for (const device of SELECTABLE_DEVICES) {
      await expect(this.deviceContainer(device)).toBeVisible();
    }
  }

  @step("Expect the use case screen")
  async expectUseCaseScreen() {
    await expect(this.page).toHaveURL(/\/onboarding\/select-use-case$/);
    await expect(this.setupNewDeviceOption).toBeVisible();
  }

  @step("Select device $0")
  async selectDevice(device: DeviceModelId) {
    const tile = this.deviceTile(device);
    await expect(tile).toBeVisible();
    // The tile only becomes clickable while its container is hovered.
    await this.deviceContainer(device).hover();
    await tile.click();
  }

  @step("Choose to set up a new device")
  async setUpNewDevice() {
    await this.setupNewDeviceOption.click();
  }

  @step("Complete the pedagogy screens")
  async completePedagogy() {
    await expect(this.pedagogyModal).toBeVisible();

    for (let screen = 0; screen < MAX_PEDAGOGY_SCREENS; screen++) {
      if (await this.stepperEnd.isVisible()) {
        await this.stepperEnd.click();
        return;
      }
      await this.stepperContinue.click();
    }

    throw new Error(
      `Pedagogy did not reach its last screen within ${MAX_PEDAGOGY_SCREENS} screens`,
    );
  }

  @step("Continue the tutorial from $0")
  async continueTutorial(screen: TutorialScreen) {
    await this.tutorialContinueOn(screen).click();
  }

  @step("Acknowledge keeping the PIN private")
  async acceptPrivatePinCode() {
    await this.pinCodeCheckbox.click();
  }

  @step("Continue past the PIN drawer")
  async continuePinDrawer() {
    await this.pinCodeDrawerNext.click();
  }

  @step("Acknowledge the recovery phrase warning")
  async acceptRecoveryPhrase() {
    await this.recoveryPhraseCheckbox.click();
  }

  @step("Continue past the recovery phrase drawer")
  async continueRecoverySeedDrawer() {
    await this.recoverySeedDrawerNext.click();
  }

  @step("Continue past the hide-seed drawer")
  async continueHideSeedDrawer() {
    await this.hideSeedDrawerNext.click();
  }

  @step("Complete the security quiz")
  async completeQuiz() {
    await this.quizStartButton.click();
    await this.quizAnswerBottom.click();
    await this.stepperContinue.click();
    await this.quizAnswerBottom.click();
    await this.stepperContinue.click();
    await this.quizAnswerTop.click();
    await this.stepperEnd.click();
  }

  @step("Continue past the secondary tutorial action on $0")
  async continueTutorialSecondary(screen: TutorialScreen) {
    await this.tutorialContinueSecondaryOn(screen).click();
  }

  @step("Expect onboarding to be complete")
  async expectOnboardingComplete() {
    await expect(this.tutorialContinueOnAnyScreen).toBeHidden();
  }

  @step("Work through the PIN and recovery phrase guides")
  async completeTutorialSteps() {
    await this.continueTutorial("how-to-get-started");
    await this.continueTutorial("device-how-to");

    await this.acceptPrivatePinCode();
    await this.continueTutorial("pin-code");
    await this.continueTutorial("pin-code-how-to");
    await this.continuePinDrawer();

    await this.acceptRecoveryPhrase();
    await this.continueTutorial("new-recovery-phrase");
    await this.continueTutorial("use-recovery-sheet");
    await this.continueTutorial("recovery-how-to-3");
    await this.continueRecoverySeedDrawer();
    await this.continueTutorial("hide-recovery-phrase");
    await this.continueHideSeedDrawer();
  }

  @step("Run the genuine check")
  async runGenuineCheck() {
    await this.tutorialContinueOn("pair-my-nano").click();
    await expect(this.renderError).toBeHidden();
    await expect(this.tutorialContinueOn("genuine-check")).toBeEnabled();
  }
}
