import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { OnboardingPage } from "../../page/onboarding.page";

test.use({
  settings: { hasSeenAnalyticsOptInPrompt: false },
  featureFlags: {
    welcomeScreenVideoCarousel: { enabled: false },
    noah: { enabled: false },
  },
});

enum Nano {
  nanoX = "nanoX",
  nanoS = "nanoS",
  nanoSP = "nanoSP",
}

const nanos = [Nano.nanoX, Nano.nanoS, Nano.nanoSP];

test.describe.parallel("Onboarding", () => {
  for (const nano of nanos) {
    test(`[${nano}] Onboarding flow new device`, async ({ page }) => {
      const onboardingPage = new OnboardingPage(page);

      await test.step("Wait for launch", async () => {
        await onboardingPage.waitForLaunch();
        await expect(page).toHaveScreenshot("v3-get-started.png", {
          mask: [page.locator("video")],
        });
      });

      await test.step("Get started", async () => {
        await onboardingPage.getStarted();
        await onboardingPage.hoverDevice(Nano.nanoS);
        await expect(page).toHaveScreenshot("v3-device-selection.png", {
          mask: [page.locator("video")],
          animations: "disabled",
        });
      });

      await test.step(`[${nano}] Select Device`, async () => {
        await onboardingPage.selectDevice(nano);
      });

      await test.step(`[${nano}]" Set up new"`, async () => {
        await page.getByTestId("v3-onboarding-new-device").waitFor({ state: "visible" });
        await expect(page).toHaveScreenshot(`v3-device-setup-${nano}.png`);
        await onboardingPage.newDevice();
      });

      await test.step("Pedagogy", async () => {
        await onboardingPage.pedagogyModal.waitFor({ state: "visible" });
        await onboardingPage.waitForPedagogyModal();
        await expect(onboardingPage.pedagogyModal).toHaveScreenshot([
          "v3-pedagogy",
          "access-your-crypto.png",
        ]);
        await onboardingPage.pedagogyContinue();

        await expect(onboardingPage.pedagogyModal).toHaveScreenshot([
          "v3-pedagogy",
          "own-your-private-key.png",
        ]);
        await onboardingPage.pedagogyContinue();

        await expect(onboardingPage.pedagogyModal).toHaveScreenshot([
          "v3-pedagogy",
          "stay-offline.png",
        ]);
        await onboardingPage.pedagogyContinue();

        await expect(onboardingPage.pedagogyModal).toHaveScreenshot([
          "v3-pedagogy",
          "validate-transactions.png",
        ]);
        await onboardingPage.pedagogyContinue();

        await expect(onboardingPage.pedagogyModal).toHaveScreenshot([
          "v3-pedagogy",
          "lets-set-up-your-nano.png",
        ]);
        await onboardingPage.pedagogyEnd();
      });

      await test.step("Set up new device", async () => {
        await expect(page).toHaveScreenshot(["v3-setup-new-device", "get-started-1.png"]);
        await onboardingPage.continueTutorial();
        await expect
          .soft(page)
          .toHaveScreenshot(["v3-setup-new-device", `get-started-2-${nano}.png`], {
            mask: [onboardingPage.roleAnimation],
            timeout: 10000,
          });
        await onboardingPage.continueTutorial();

        await expect(page).toHaveScreenshot(["v3-setup-new-device", `pin-code-${nano}-1.png`]);
        await onboardingPage.acceptPrivatePinCode();

        await expect(page).toHaveScreenshot(["v3-setup-new-device", `pin-code-${nano}-2.png`]);
        await onboardingPage.continueTutorial();

        await expect
          .soft(page)
          .toHaveScreenshot(["v3-setup-new-device", `pin-code-${nano}-3.png`], {
            mask: [onboardingPage.roleAnimation],
            timeout: 10000,
          });
        await onboardingPage.continueTutorial();

        await expect(page).toHaveScreenshot(["v3-setup-new-device", `pin-code-${nano}-4.png`]);
        await onboardingPage.continuePinDrawer();

        await expect(page).toHaveScreenshot(["v3-setup-new-device", "recovery-phrase-1.png"]);
        await onboardingPage.acceptRecoveryPhrase();

        await expect(page).toHaveScreenshot(["v3-setup-new-device", "recovery-phrase-2.png"]);
        await onboardingPage.continueTutorial();

        await expect(page).toHaveScreenshot(["v3-setup-new-device", "recovery-phrase-3.png"]);
        await onboardingPage.continueTutorial();

        await expect(page).toHaveScreenshot(
          ["v3-setup-new-device", `recovery-phrase-4-${nano}.png`],
          {
            mask: [page.locator("[role=animation]")],
            timeout: 10000,
          },
        );
        await onboardingPage.continueTutorial();

        await expect(page).toHaveScreenshot(
          ["v3-setup-new-device", `recovery-phrase-5-${nano}.png`],
          {
            mask: [page.locator("[role=animation]")],
            timeout: 10000,
          },
        );
        await onboardingPage.continueRecoverySeedDrawer();

        await expect(page).toHaveScreenshot(["v3-setup-new-device", "recovery-phrase-6.png"]);
        await onboardingPage.continueTutorial();

        await expect(page).toHaveScreenshot(["v3-setup-new-device", "recovery-phrase-7.png"]);
        await onboardingPage.continueHideSeedDrawer();
      });

      await test.step("Pass quiz", async () => {
        await expect(page).toHaveScreenshot(["v3-quiz", "start.png"]);

        await onboardingPage.startQuiz();
        await expect(onboardingPage.quizContainer).toHaveScreenshot(["v3-quiz", "question-1.png"]);

        await onboardingPage.answerQuizBottom();
        await expect(onboardingPage.quizContainer).toHaveScreenshot(["v3-quiz", "answer-1.png"]);

        await onboardingPage.quizNextQuestion();
        await expect(onboardingPage.quizContainer).toHaveScreenshot(["v3-quiz", "question-2.png"]);

        await onboardingPage.answerQuizBottom();
        await expect(onboardingPage.quizContainer).toHaveScreenshot(["v3-quiz", "answer-2.png"]);

        await onboardingPage.quizNextQuestion();
        await expect(onboardingPage.quizContainer).toHaveScreenshot(["v3-quiz", "question-3.png"]);

        await onboardingPage.answerQuizTop();
        await expect(onboardingPage.quizContainer).toHaveScreenshot(["v3-quiz", "answer-3.png"]);

        await onboardingPage.quizEnd();
        await expect(page).toHaveScreenshot(["v3-quiz", "end.png"]);

        await onboardingPage.continueTutorial();
      });

      await test.step(`[${nano}]"Device genuine check"`, async () => {
        await expect(page).toHaveScreenshot("v3-genuine-check.png");
        await onboardingPage.checkDevice();
        await expect(page).toHaveScreenshot("v3-before-genuine-check.png");
      });

      await test.step("Pass genuine check", async () => {
        await expect(page).toHaveScreenshot("v3-genuine-checking.png");
        await onboardingPage.genuineCheck();
        await expect(page).toHaveScreenshot("v3-genuine-check-done.png");
      });

      await test.step("Reach app", async () => {
        await onboardingPage.reachApp();
        await expect(page).toHaveScreenshot("v3-onboarding-complete.png");
      });
    });
  }
});
