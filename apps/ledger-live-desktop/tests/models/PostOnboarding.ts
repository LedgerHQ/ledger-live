import { Page, Locator } from "@playwright/test";

export class PostOnboarding {
  readonly page: Page;
  readonly postOnboardingHubTesterButton: Locator;
  readonly postOnboardingHubActionRowClaimMock: Locator;
  readonly postOnboardingHubActionRowMigrateAssetsMock: Locator;
  readonly postOnboardingHubActionRowPersonalizeMock: Locator;

  readonly goToHubButton: Locator;
  readonly postOnboardingBannerEntryPoint: Locator;
  readonly postOnboardingHubSkipButton: Locator;
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

    this.goToHubButton = page.locator("data-test-id=postonboarding-go-to-hub-button");
    this.postOnboardingBannerEntryPoint = page.locator(
      "data-test-id=postonboarding-banner-entry-point",
    );
    this.postOnboardingHubSkipButton = page.locator("data-test-id=postonboarding-hub-skip-button");
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

  async skipPostOnboardingHub() {
    await this.postOnboardingHubSkipButton.click();
  }

  async completeAndGoToHub() {
    await this.goToHubButton.click();
  }

  async goPostOnboardingHubFromDashboardBanner() {
    await this.postOnboardingBannerEntryPoint.click();
  }
}
