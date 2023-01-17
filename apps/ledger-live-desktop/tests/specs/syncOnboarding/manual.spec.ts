import { expect } from "@playwright/test";

import test from "../../fixtures/common";
import { OnboardingPage } from "../../models/OnboardingPage";
import { ManualPage } from "../../models/ManualPage";

test.use({ featureFlags: { syncOnboarding: { enabled: true } } });

test("Manual", async ({ page }) => {
  const manualPage = new ManualPage(page);
  const onboardingPage = new OnboardingPage(page);

  await test.step("Get started", async () => {
    await onboardingPage.getStarted();
  });

  await test.step("Select device", async () => {
    await onboardingPage.selectDevice("stax"); // TODO: do better
  });

  await test.step("Take screenshot of main screen", async () => {
    expect(await page.screenshot()).toMatchSnapshot("sync-onboarding-manual.png");
  });

  await test.step("Open help drawer", async () => {
    await manualPage.openHelpDrawer();
    expect(await page.screenshot()).toMatchSnapshot("sync-onboarding-manual-help.png");
  });
});
