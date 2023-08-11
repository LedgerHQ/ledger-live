import { expect } from "@playwright/test";
import test from "../../fixtures/common";
import { OnboardingPage } from "../../models/OnboardingPage";

test.use({ featureFlags: { syncOnboarding: { enabled: true } } });

test("Manual @smoke", async ({ page }) => {
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
});
