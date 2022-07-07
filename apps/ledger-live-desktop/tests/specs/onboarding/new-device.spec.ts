import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { OnboardingPage } from "../../models/OnboardingPage";
import { DeviceAction } from "../../models/DeviceAction";

const nanos = ["nanoS", "nanoSP", "nanoX"];

test.use({
  env: {
    // A cheap way of not displaying the firmware update banner in the home screen.
    // Without this, the new device will get detected as having an outdated firmware.
    // The test suite is making calls to the MANAGER_API_BASE address.
    // This is not right, and should be replaced with proper mocks.
    DEBUG_FW_VERSION: "",
  },
});

test.describe.parallel("Onboarding", () => {
  for (const nano of nanos) {
    test(`[${nano}] Onboarding flow new device`, async ({ page }) => {
      const onboardingPage = new OnboardingPage(page);
      const deviceAction = new DeviceAction(page);

      await test.step("Get started", async () => {
        await expect(onboardingPage.getStartedButton).toBeVisible();
        await expect(page).toHaveScreenshot("getstarted.png");
        await onboardingPage.getStarted();
      });

      await test.step("Terms of service", async () => {
        await expect(page).toHaveScreenshot("terms.png");
        await onboardingPage.acceptTerms();
      });

      await test.step(`[${nano}]" Select Device"`, async () => {
        await expect(page).toHaveScreenshot("device-selection.png");
        await onboardingPage.selectDevice(nano);
      });

      await test.step(`[${nano}]" Set Up new"`, async () => {
        await expect(page).toHaveScreenshot(`${nano}-onboarding-flows.png`);
        await onboardingPage.newDevice();
      });

      await test.step("Go through Basics Carrousel", async () => {
        await expect(onboardingPage.pedagogyModal).toHaveScreenshot([
          "carousel",
          "access-your-crypto.png",
        ]);
        await onboardingPage.basicsCarrouselRight();
        await expect(onboardingPage.pedagogyModal).toHaveScreenshot([
          "carousel",
          "own-your-private-key.png",
        ]);
        await onboardingPage.basicsCarrouselRight();
        await expect(onboardingPage.pedagogyModal).toHaveScreenshot([
          "carousel",
          "stay-offline.png",
        ]);
        await onboardingPage.basicsCarrouselRight();
        await expect(onboardingPage.pedagogyModal).toHaveScreenshot([
          "carousel",
          "validate-transactions.png",
        ]);
        await onboardingPage.basicsCarrouselRight();
        await expect(onboardingPage.pedagogyModal).toHaveScreenshot([
          "carousel",
          "lets-set-up-your-nano.png",
        ]);
      });

      await test.step("Set Up new device", async () => {
        await onboardingPage.setupWallet();
        await expect(page).toHaveScreenshot(`start-setup.png`);
        await onboardingPage.startSetup();
        await expect(page).toHaveScreenshot(`set-pincode.png`);
        await onboardingPage.setPincode();
        await expect(page).toHaveScreenshot(`set-passphrase.png`);
        await onboardingPage.setPassphrase();
      });

      await test.step("Pass Quiz", async () => {
        await expect(page).toHaveScreenshot(`quiz-start.png`);
        await onboardingPage.startQuiz();
        await expect(onboardingPage.quizContainer).toHaveScreenshot([
          "quiz",
          "question-1.png",
        ]);
        await onboardingPage.answerQuizBottom();
        await expect(onboardingPage.quizContainer).toHaveScreenshot([
          "quiz",
          "answer-1.png",
        ]);
        await onboardingPage.quizNextQuestion();
        await expect(onboardingPage.quizContainer).toHaveScreenshot([
          "quiz",
          "question-2.png",
        ]);
        await onboardingPage.answerQuizBottom();
        await expect(onboardingPage.quizContainer).toHaveScreenshot([
          "quiz",
          "answer-2.png",
        ]);
        await onboardingPage.quizNextQuestion();
        await expect(onboardingPage.quizContainer).toHaveScreenshot([
          "quiz",
          "question-3.png",
        ]);
        await onboardingPage.answerQuizTop();
        await expect(onboardingPage.quizContainer).toHaveScreenshot([
          "quiz",
          "answer-3.png",
        ]);
        await onboardingPage.quizNextQuestion();
        await expect(page).toHaveScreenshot("quiz-success.png");
        await onboardingPage.quizEnd();
      });

      await test.step(`[${nano}]"Device genuine check"`, async () => {
        await expect(page).toHaveScreenshot(`connect-${nano}.png`);
        await onboardingPage.checkDevice();
        await expect(page).toHaveScreenshot("before-genuine-check.png");
      });

      await test.step("Pass genuine check", async () => {
        await deviceAction.genuineCheck();
        await expect(page).toHaveScreenshot("genuine-check-done.png");
      });

      await test.step("Reach app", async () => {
        await onboardingPage.continue();
        await expect(page).toHaveScreenshot("onboarding-complete.png");
      });
    });
  }
});
