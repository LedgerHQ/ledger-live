import { expect } from "@playwright/test";
import test from "../../fixtures/common";
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

      await test.step(`[${nano}] Already set up`, async () => {
        await page.getByTestId("v3-onboarding-initialized-device").waitFor({ state: "visible" });
        await expect(page).toHaveScreenshot(`v3-device-connection-${nano}.png`);
        await onboardingPage.connectDevice();
      });

      await test.step(`[${nano}] Device genuine check`, async () => {
        await expect(page).toHaveScreenshot("v3-genuine-check.png");
        await onboardingPage.checkDevice();
        await onboardingPage.continueButton.isEnabled({ timeout: 10000 });
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
