import { expect } from "@playwright/test";

import test from "../../fixtures/common";
import { OnboardingPage } from "../../models/OnboardingPage";

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
        expect(
          await onboardingPage.page.screenshot({
            mask: [page.locator("video")],
          }),
        ).toMatchSnapshot("v3-get-started.png");
      });

      await test.step("Get started", async () => {
        await onboardingPage.getStarted();
        expect(await onboardingPage.page.screenshot()).toMatchSnapshot("v3-device-selection.png");
      });

      await test.step(`[${nano}] Select Device`, async () => {
        await onboardingPage.selectDevice(nano);
      });

      await test.step(`[${nano}] Already set up`, async () => {
        expect(await page.screenshot()).toMatchSnapshot(`v3-device-connection-${nano}.png`);
        await onboardingPage.connectDevice();
      });

      await test.step(`[${nano}] Device genuine check`, async () => {
        expect(await onboardingPage.page.screenshot()).toMatchSnapshot("v3-genuine-check.png");
        await onboardingPage.checkDevice();
        await onboardingPage.continueButton.isEnabled({ timeout: 10000 });
        expect(await onboardingPage.page.screenshot()).toMatchSnapshot(
          "v3-before-genuine-check.png",
        );
      });

      await test.step("Pass genuine check", async () => {
        expect(await onboardingPage.page.screenshot()).toMatchSnapshot("v3-genuine-checking.png");
        await onboardingPage.genuineCheck();
        expect(await onboardingPage.page.screenshot()).toMatchSnapshot("v3-genuine-check-done.png");
      });

      await test.step("Reach app", async () => {
        await onboardingPage.reachApp();
        expect(await onboardingPage.page.screenshot()).toMatchSnapshot(
          "v3-onboarding-complete.png",
        );
      });
    });
  }
});
