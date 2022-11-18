import { Page, Locator } from "@playwright/test";

export class PostOnboarding {
  readonly page: Page;
  readonly postOnboardingHubTesterButton: Locator;
  readonly postOnboardingHubActionRowClaimMock: Locator;
  readonly postOnboardingHubActionRowMigrateAssetsMock: Locator;
  readonly postOnboardingHubActionRowPersonalizeMock: Locator;

  readonly goToDashboardButton: Locator;
  readonly goToHubButton: Locator;
  readonly postOnboardingBannerEntryPoint: Locator;
  readonly postOnboardingHubScreenSkipButton: Locator;
  readonly postOnboardingHubDrawerSkipButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.postOnboardingHubTesterButton = page.locator("data-test-id=postonboarding-tester-button");
    this.postOnboardingHubActionRowClaimMock = page.locator(
      "data-test-id=postonboarding-action-row-claimMock",
    );
    this.postOnboardingHubActionRowMigrateAssetsMock = page.locator(
      "data-test-id=postonboarding-action-row-migrateAssetsMock",
    );
    this.postOnboardingHubActionRowPersonalizeMock = page.locator(
      "data-test-id=postonboarding-action-row-personalizeMock",
    );
    this.goToDashboardButton = page
      .locator("data-test-id=postonboarding-go-to-dashboard-button")
      .nth(0);
    this.goToHubButton = page.locator("data-test-id=postonboarding-go-to-hub-button").nth(0);
    this.postOnboardingBannerEntryPoint = page.locator(
      "data-test-id=postonboarding-banner-entry-point",
    );
    this.postOnboardingHubScreenSkipButton = page.locator(
      "data-test-id=postonboarding-hub-screen-skip-button",
    );
    this.postOnboardingHubDrawerSkipButton = page
      .locator("data-test-id=postonboarding-hub-drawer-skip-button")
      .nth(0);
  }

  async waitForLaunch() {
    await this.postOnboardingHubTesterButton.waitFor({ state: "visible" });
  }

  async navigateToPostOnboardingScreen() {
    await this.postOnboardingHubTesterButton.click();
  }

  async startClaimMock() {
    await this.postOnboardingHubActionRowClaimMock.click();
  }

  async startMigrateAssetsMock() {
    await this.postOnboardingHubActionRowMigrateAssetsMock.click();
  }

  async startPersonalizeMock() {
    await this.postOnboardingHubActionRowPersonalizeMock.click();
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
    await this.postOnboardingHubDrawerSkipButton.click();
  }
}
