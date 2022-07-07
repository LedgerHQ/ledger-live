import test from "../../../fixtures/common";
import { expect } from "@playwright/test";
import { OnboardingPage } from "../../../models/v3/OnboardingPage";

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

      await test.step("Get started", async () => {
        await onboardingPage.getStarted();
      });

      await test.step(`[${nano}] Select Device`, async () => {
        await onboardingPage.selectDevice(nano);
      });

      await test.step(`[${nano}] Restore device`, async () => {
        expect(await page.screenshot()).toMatchSnapshot("v3-restore-device.png");
        await onboardingPage.restoreDevice();

        await onboardingPage.startTutorial("v3-restore-tutorial");

        await onboardingPage.setPinCode("v3-restore-tutorial");

        expect(await page.screenshot()).toMatchSnapshot([
          "v3-restore-tutorial",
          "recovery-phrase-1.png",
        ]);
        await onboardingPage.acceptRecoveryPhraseLoss();

        expect(await page.screenshot()).toMatchSnapshot([
          "v3-restore-tutorial",
          "recovery-phrase-2.png",
        ]);
        await onboardingPage.continueTutorial();

        expect(await page.screenshot()).toMatchSnapshot([
          "v3-restore-tutorial",
          "recovery-phrase-3.png",
        ]);
        await onboardingPage.continueTutorial();

        expect(await page.screenshot()).toMatchSnapshot([
          "v3-restore-tutorial",
          "recovery-phrase-4.png",
        ]);
        await onboardingPage.continueTutorial();

        expect(await page.screenshot()).toMatchSnapshot([
          "v3-restore-tutorial",
          "recovery-phrase-5.png",
        ]);
        await onboardingPage.continueRecoverySeedDrawer();
      });

      await test.step(`[${nano}] Device genuine check`, async () => {
        await onboardingPage.checkDevice();
      });

      await test.step("Pass genuine check", async () => {
        await onboardingPage.genuineCheck();
      });

      await test.step("Reach app", async () => {
        await onboardingPage.reachApp();
      });
    });
  }
});
