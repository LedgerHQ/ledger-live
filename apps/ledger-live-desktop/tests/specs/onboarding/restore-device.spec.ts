import { expect } from "@playwright/test";
import test from "../../fixtures/common";
import { OnboardingPage } from "../../page/onboarding.page";

test.use({
  settings: { hasSeenAnalyticsOptInPrompt: false },
});

enum Nano {
  nanoX = "nanoX",
  nanoS = "nanoS",
  nanoSP = "nanoSP",
}

const nanos = [Nano.nanoX, Nano.nanoS, Nano.nanoSP];

test.describe.parallel("Onboarding", () => {
  for (const nano of nanos) {
    test(`[${nano}] Onboarding flow already set up`, async ({ page }) => {
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

      await test.step(`[${nano}] Restore device`, async () => {
        await expect(page).toHaveScreenshot(`v3-restore-device-${nano}.png`);
        await onboardingPage.restoreDevice();

        await expect(page).toHaveScreenshot(["v3-restore-tutorial", "get-started-1.png"]);
        await onboardingPage.continueTutorial();

        await expect
          .soft(page)
          .toHaveScreenshot(["v3-restore-tutorial", `get-started-2-${nano}.png`], {
            mask: [onboardingPage.roleAnimation],
          });
        await onboardingPage.continueTutorial();

        await expect(page).toHaveScreenshot(["v3-restore-tutorial", `pin-code-${nano}-1.png`]);
        await onboardingPage.acceptPrivatePinCode();

        await expect(page).toHaveScreenshot(["v3-restore-tutorial", `pin-code-${nano}-2.png`]);
        await onboardingPage.continueTutorial();

        await expect
          .soft(page)
          .toHaveScreenshot(["v3-restore-tutorial", `pin-code-${nano}-3.png`], {
            mask: [onboardingPage.roleAnimation],
          });
        await onboardingPage.continueTutorial();

        await expect(page).toHaveScreenshot(["v3-restore-tutorial", `pin-code-${nano}-4.png`], {
          mask: [onboardingPage.roleAnimation],
        });
        await onboardingPage.continuePinDrawer();

        await expect(page).toHaveScreenshot(["v3-restore-tutorial", "recovery-phrase-1.png"]);
        await onboardingPage.acceptRecoveryPhraseLoss();

        await expect(page).toHaveScreenshot(["v3-restore-tutorial", "recovery-phrase-2.png"]);
        await onboardingPage.continueTutorial();

        await expect(page).toHaveScreenshot(["v3-restore-tutorial", "recovery-phrase-3.png"]);
        await onboardingPage.continueTutorial();

        await expect(page).toHaveScreenshot(["v3-restore-tutorial", "recovery-phrase-4.png"]);
        await onboardingPage.continueTutorial();

        await expect(page).toHaveScreenshot(["v3-restore-tutorial", "recovery-phrase-5.png"]);
        await onboardingPage.continueRecoverySeedDrawer();
      });

      await test.step(`[${nano}] Device genuine check`, async () => {
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
