/* eslint-disable jest/expect-expect */
import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { SettingsPage } from "../../page/settings.page";
import { Layout } from "../../component/layout.component";
import { PostOnboarding } from "../../page/post.onboarding.page";
import padStart from "lodash/padStart";

test.use({
  userdata: "1AccountBTC1AccountETHwCarousel", // to have a non empty portfolio page and potentially detect layout issues with the post onboarding banner
  env: { DEBUG_POSTONBOARDINGHUB: "1" },
});

let screenshotIndex = 0;

test("PostOnboarding state logic", async ({ page }) => {
  const settingsPage = new SettingsPage(page);
  const layout = new Layout(page);
  const postOnboarding = new PostOnboarding(page);

  /**
   * Allows to easily navigate between screenshots in their order of execution.
   * Yes if we remove/add screenshots it will shift everything but that should
   * happened rarely, and even then it will be more convenient to check that the
   * screenshots are correct by examining them in order.
   * */
  function generateScreenshotPrefix() {
    const prefix = `custom-image-${padStart(screenshotIndex.toString(), 3, "0")}-`;
    screenshotIndex += 1;
    return prefix;
  }

  await test.step("go to post onboarding screen", async () => {
    await layout.goToSettings();
    await settingsPage.enableAndGoToDeveloperTab();
    await postOnboarding.startNewMockPostOnboarding();
    await expect(page).toHaveScreenshot(`${generateScreenshotPrefix()}postonboarding-screen.png`);
  });

  await test.step('start "claim" mocked action', async () => {
    await postOnboarding.startClaimMock();
    await expect(page).toHaveScreenshot(
      `${generateScreenshotPrefix()}postonboarding-action-claim-mocked.png`,
    );
  });

  await test.step('complete "claim" mocked action and go to post onboarding hub', async () => {
    await postOnboarding.completeActionAndGoToHub();
    await expect(page).toHaveScreenshot(
      `${generateScreenshotPrefix()}postonboarding-completed-action-claim-mocked.png`,
    );
  });

  await test.step("skip post onboarding", async () => {
    await postOnboarding.skipPostOnboardingHub();
    await expect(page).toHaveScreenshot(
      `${generateScreenshotPrefix()}postonboarding-banner-in-dashboard.png`,
      {
        mask: [page.locator("canvas"), layout.marketPerformanceWidget],
      },
    );
  });

  await test.step("go to post onboarding hub from banner", async () => {
    await postOnboarding.goPostOnboardingHubFromDashboardBanner();
  });

  await test.step('start "migrate assets" mocked action', async () => {
    await postOnboarding.startMigrateAssetsMock();
    await expect(page).toHaveScreenshot(
      `${generateScreenshotPrefix()}postonboarding-action-migrate-assets-mocked.png`,
    );
  });

  await test.step('complete "migrate asset" mocked action', async () => {
    await postOnboarding.completeActionAndGoToHub();
    await expect(page).toHaveScreenshot(
      `${generateScreenshotPrefix()}postonboarding-completed-claim-and-migrate.png`,
    );
  });

  await test.step("start and complete 'personalize' mocked action", async () => {
    await postOnboarding.startPersonalizeMock();
    await postOnboarding.completeActionAndGoToHub();
    await expect(page).toHaveScreenshot(
      `${generateScreenshotPrefix()}postonboarding-completed-all-actions.png`,
    );
  });

  await test.step("go to dashboard with explore button", async () => {
    await postOnboarding.goToDashboard();
    await postOnboarding.postOnboardingHubContainer.waitFor({ state: "detached" });
    await expect(page).toHaveScreenshot(
      `${generateScreenshotPrefix()}postonboarding-done-no-banner-in-dashboard.png`,
      {
        mask: [page.locator("canvas"), layout.marketPerformanceWidget],
      },
    );
  });
});
