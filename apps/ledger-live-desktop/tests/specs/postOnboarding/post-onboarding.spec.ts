/* eslint-disable jest/expect-expect */
import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { SettingsPage } from "../../models/SettingsPage";
import { Layout } from "../../models/Layout";
import { PostOnboarding } from "../../models/PostOnboarding";

test.use({
  userdata: "skip-onboarding",
  env: { DEBUG_POSTONBOARDINGHUB: 1 },
  featureFlags: { customImage: { enabled: true } },
});

test("PostOnboarding", async ({ page }) => {
  const settingsPage = new SettingsPage(page);
  const layout = new Layout(page);
  const postOnboarding = new PostOnboarding(page);
  await test.step("go to post onboarding screen", async () => {
    await layout.goToSettings();
    await settingsPage.goToExperimentalTab();
    await postOnboarding.waitForLaunch();
    await postOnboarding.navigateToPostOnboardingScreen();
    await expect(page).toHaveScreenshot("postonboarding-screen.png");
  });

  await test.step("start claim mocked action from postonboarding screen", async () => {
    await postOnboarding.startClaimMock();
    await expect(page).toHaveScreenshot("postonboarding-claim-mocked-action.png");
  });

  await test.step("complete action and go back to dashboard", async () => {
    await postOnboarding.completeAndGoToHub();
    await expect(page).toHaveScreenshot("postonboarding-hub-claim-complete.png");
  });

  await test.step("go to dashboard with banner", async () => {
    await postOnboarding.skipPostOnboardingHub();
    await expect(page).toHaveScreenshot("postonboarding-hub-banner-in-dashboard.png");
  });

  await test.step("go to post onboarding hub from banner and start migrate asset", async () => {
    await postOnboarding.goPostOnboardingHubFromDashboardBanner();
    await postOnboarding.startMigrateAssetsMock();
    await expect(page).toHaveScreenshot("postonboarding-start-migrate-assets-mocked-action.png");
  });

  await test.step("complete migrate asset", async () => {
    await postOnboarding.completeAndGoToHub();
    await expect(page).toHaveScreenshot("postonboarding-2-actions-completed.png");
  });

  await test.step("complete personalize mock", async () => {
    await postOnboarding.startPersonalizeMock();
    await postOnboarding.completeAndGoToHub();
    await expect(page).toHaveScreenshot("postonboarding-hub-all-actions-completed.png");
  });

  await test.step("go to dashboard with automatic redirection", async () => {
    await page.waitForTimeout(4500);
    await expect(page).toHaveScreenshot("postonboarding-hub-no-banner-in-dashboard.png");
  });
});
