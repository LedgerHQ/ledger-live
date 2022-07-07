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

      await test.step(`[${nano}] Already set up`, async () => {
        expect(await page.screenshot()).toMatchSnapshot(`v3-device-connection-${nano}.png`);
        await onboardingPage.connectDevice();
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
