/* eslint-disable jest/expect-expect */
import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { SettingsPage } from "../../models/SettingsPage";
import { Layout } from "../../models/Layout";
import { PostOnboarding } from "../../models/PostOnboarding";

test.use({ userdata: "skip-onboarding", env: { DEBUG_POSTONBOARDINGHUB: 1 } });

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

  await test.step("start first mocked action from postonboarding screen", async () => {
    await postOnboarding.startFirstMockedAction();
    await expect(page).toHaveScreenshot("postonboarding-first-mocked-action.png");
    //await onboardingPage.pedagogyModal.waitFor({ state: "visible" });
  });

  await test.step("go back to postonboarding hub in drawer", async () => {
    await postOnboarding.goToHub();
    await expect(page).toHaveScreenshot("postonboarding-hub-inside-drawer-1-action-completed.png");
  });

  await test.step("start second mocked action from postonboarding drawer", async () => {
    await postOnboarding.startSecondMockedAction();
    await expect(page).toHaveScreenshot("postonboarding-second-mocked-action.png");
  });

  await test.step("go back to dashboard", async () => {
    await postOnboarding.goToDashboard();
    await expect(page).toHaveScreenshot("postonboarding-dashboard-banner.png");
  });

  await test.step("go back to hub from dashboard banner", async () => {
    await postOnboarding.goPostOnboardingHubFromDashboardBanner();
    await expect(page).toHaveScreenshot("postonboarding-hub-inside-drawer-2-action-completed.png");
  });

  await test.step("skip postonboarding hub and go back to it", async () => {
    await postOnboarding.skipPostOnboardingHub();
    await postOnboarding.goPostOnboardingHubFromDashboardBanner();
    await expect(page).toHaveScreenshot("postonboarding-hub-inside-drawer-2-action-completed.png");
  });

  await test.step("do the third post onboarding action", async () => {
    await postOnboarding.startThirdMockedAction();
    await postOnboarding.goToHub();
    await expect(page).toHaveScreenshot("postonboarding-hub-inside-drawer-3-action-completed.png");
  });

  await test.step("close post onboarding drawer", async () => {
    await postOnboarding.skipPostOnboardingHub();
    await expect(page).toHaveScreenshot("postonboarding-hub-dashboard-no-entry-banner.png");
  });
});
