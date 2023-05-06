/* eslint-disable jest/expect-expect */
import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { SettingsPage } from "../../models/SettingsPage";
import { Layout } from "../../models/Layout";
import { PostOnboarding } from "../../models/PostOnboarding";
import { PortfolioPage } from "../../models/PortfolioPage";

test.use({
  userdata: "1AccountBTC1AccountETHwCarousel", // to have a non empty portfolio page and potentially detect layout issues with the post onboarding banner
  env: { DEBUG_POSTONBOARDINGHUB: 1 },
  featureFlags: { customImage: { enabled: true } },
});

test("PostOnboarding state persistency", async ({ page }) => {
  const settingsPage = new SettingsPage(page);
  const layout = new Layout(page);
  const postOnboarding = new PostOnboarding(page);
  const portfolioPage = new PortfolioPage(page);

  await test.step("go to post onboarding screen", async () => {
    await layout.goToSettings();
    await settingsPage.goToExperimentalTab();
    await postOnboarding.waitForLaunch();
    await postOnboarding.startNewMockPostOnboarding();
  });

  await test.step('start and complete "claim" mocked action', async () => {
    await expect(
      postOnboarding.postOnboardingHubActionRowClaimMock.getAttribute("onClick"),
    ).toBeTruthy();
    await postOnboarding.startClaimMock();
    await postOnboarding.completeActionAndGoToHub();
    await postOnboarding.skipPostOnboardingHub();
  });

  await test.step("reloading app", async () => {
    // await page.waitForTimeout(20000); // because setKey (saving key/value pairs to DB) is debounced at 1000ms
    // await page.reload();
  });

  await test.step('"claim" action button should be disabled (completed)', async () => {
    await postOnboarding.postOnboardingBannerEntryPoint.waitFor({ state: "visible" });
    await postOnboarding.goPostOnboardingHubFromDashboardBanner();
    await expect(
      postOnboarding.postOnboardingHubActionRowClaimMock.getAttribute("onClick"),
    ).toMatchObject({});
  });

  await test.step("dismissing post onboarding hub banner", async () => {
    await postOnboarding.skipPostOnboardingHub();
    await postOnboarding.closePostOnboardingHubDashboardBanner();
  });

  await test.step("reloading app", async () => {
    // await page.waitForTimeout(20000); // because setKey (saving key/value pairs to DB) is debounced at 1000ms
    // await page.reload();
  });

  // TODO: check that banner is still dismissed (not there at all)
  await test.step("post onboarding banner should not be visible anymore", async () => {
    await portfolioPage.portfolioContainer.waitFor({ state: "visible" });
    expect(postOnboarding.postOnboardingBannerEntryPoint).toBeHidden();
  });
});
