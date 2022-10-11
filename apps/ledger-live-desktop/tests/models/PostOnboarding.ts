import { Page, Locator } from "@playwright/test";

export class PostOnboarding {
  readonly page: Page;
  readonly postOnboardingHubTesterButton: Locator;
  readonly postOnboardingHubActionRow0: Locator;
  readonly postOnboardingHubActionRow1: Locator;
  readonly postOnboardingHubActionRow2: Locator;
  readonly goToDashboardButton: Locator;
  readonly goToHubButton: Locator;
  readonly postOnboardingBannerEntryPoint: Locator;
  readonly postOnboardingHubSkipButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.postOnboardingHubTesterButton = page.locator("data-test-id=postonboarding-tester-button");
    this.postOnboardingHubActionRow0 = page.locator("data-test-id=postonboarding-action-row-0");
    this.postOnboardingHubActionRow1 = page.locator("data-test-id=postonboarding-action-row-1");
    this.postOnboardingHubActionRow2 = page.locator("data-test-id=postonboarding-action-row-2");
    this.goToDashboardButton = page.locator("data-test-id=postonboarding-go-to-dashboard-button");
    this.goToHubButton = page.locator("data-test-id=postonboarding-go-to-dashboard-button");
    this.postOnboardingBannerEntryPoint = page.locator(
      "data-test-id=postonboarding-banner-entry-point",
    );
    this.postOnboardingHubSkipButton = page.locator("data-test-id=postonboarding-hub-skip-button");
  }

  async waitForLaunch() {
    await this.postOnboardingHubTesterButton.waitFor({ state: "visible" });
  }

  async navigateToPostOnboardingScreen() {
    await this.postOnboardingHubTesterButton.click();
  }

  async startFirstMockedAction() {
    await this.postOnboardingHubActionRow0.click();
  }

  async startSecondMockedAction() {
    await this.postOnboardingHubActionRow1.click();
  }

  async startThirdMockedAction() {
    await this.postOnboardingHubActionRow2.click();
  }

  async goToDashboard() {
    await this.goToDashboardButton.click();
  }

  async goToHub() {
    await this.goToHubButton.click();
  }

  async goPostOnboardingHubFromDashboardBanner() {
    await this.postOnboardingBannerEntryPoint.click();
  }

  async skipPostOnboardingHub() {
    await this.postOnboardingHubSkipButton.click();
  }
}
