import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import type { DeviceModelId } from "@ledgerhq/types-devices";

const MAX_PEDAGOGY_SCREENS = 10;

export class OnboardingPage extends AppPage {
  private readonly getStartedButton = this.page.getByRole("button", { name: "Get Started" });
  private readonly welcomeTitle = this.page.getByTestId("onbording-welcome-title");
  private readonly deviceTile = (device: DeviceModelId) =>
    this.page.getByTestId(`v3-device-${device}`);
  private readonly setupNewDeviceOption = this.page.getByTestId("v3-onboarding-new-device");
  private readonly pedagogyModal = this.page.getByTestId("v3-onboarding-pedagogy-modal");
  private readonly stepperContinue = this.page.getByTestId("v3-modal-stepper-continue");
  private readonly stepperEnd = this.page.getByTestId("v3-modal-stepper-end");
  private readonly tutorialContinue = this.page.getByTestId("v3-tutorial-continue");
  private readonly tutorialContinueSecondary = this.page.getByTestId(
    "v3-tutorial-continue-secondary",
  );
  private readonly pinCodeCheckbox = this.page.getByTestId("v3-private-pin-code-checkbox");
  private readonly pinCodeDrawerNext = this.page.getByTestId("v3-pin-code-drawer");
  private readonly recoveryPhraseCheckbox = this.page.getByTestId("v3-recovery-phrase-checkbox");
  private readonly recoverySeedDrawerNext = this.page.getByTestId("v3-seed-drawer");
  private readonly hideSeedDrawerNext = this.page.getByTestId("v3-hide-seed-drawer");
  private readonly quizStartButton = this.page.getByTestId("v3-quiz-start-button");
  private readonly quizAnswerTop = this.page.getByTestId("v3-quiz-answer-0");
  private readonly quizAnswerBottom = this.page.getByTestId("v3-quiz-answer-1");
  private readonly checkMyNanoButton = this.page.getByRole("button", { name: /^Check my/i });
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

  @step("Expect the device selection screen")
  async expectDeviceSelectionScreen() {
    await expect(this.page).toHaveURL(/\/onboarding\/select-device$/);
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

  @step("Continue the tutorial")
  async continueTutorial() {
    await this.tutorialContinue.click();
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

  @step("Continue past the secondary tutorial action")
  async continueTutorialSecondary() {
    await this.tutorialContinueSecondary.click();
  }

  @step("Expect onboarding to be complete")
  async expectOnboardingComplete() {
    await expect(this.tutorialContinue).toBeHidden();
  }

  @step("Work through the PIN and recovery phrase guides")
  async completeTutorialSteps() {
    await this.continueTutorial(); // get started
    await this.continueTutorial();

    await this.acceptPrivatePinCode();
    await this.continueTutorial();
    await this.continueTutorial();
    await this.continuePinDrawer();

    await this.acceptRecoveryPhrase();
    await this.continueTutorial();
    await this.continueTutorial();
    await this.continueTutorial();
    await this.continueRecoverySeedDrawer();
    await this.continueTutorial();
    await this.continueHideSeedDrawer();
  }

  @step("Run the genuine check")
  async runGenuineCheck() {
    await this.checkMyNanoButton.click();
    await expect(this.renderError).toBeHidden();
    await expect(this.tutorialContinue).toBeEnabled();
  }
}
