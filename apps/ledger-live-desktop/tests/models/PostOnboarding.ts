import { Page, Locator } from "@playwright/test";

export class PostOnboarding {
  readonly page: Page;
  readonly sideDrawerContainer: Locator;
  readonly postOnboardingHubTesterButton: Locator;
  readonly postOnboardingHubContainer: Locator;
  readonly postOnboardingHubActionRowClaimMock: Locator;
  readonly postOnboardingHubActionRowMigrateAssetsMock: Locator;
  readonly postOnboardingHubActionRowPersonalizeMock: Locator;

  readonly completeActionButton: Locator;
  readonly postOnboardingBannerEntryPoint: Locator;
  readonly postOnboardingBannerEntryPointCloseButton: Locator;
  readonly postOnboardingHubSkipButton: Locator;
  readonly postOnboardingHubDrawerSkipButton: Locator;
  readonly postOnboardingHubExploreButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sideDrawerContainer = page.locator("data-test-id=side-drawer-container");
    this.postOnboardingHubTesterButton = page.locator("data-test-id=postonboarding-tester-button");
    this.postOnboardingHubContainer = page.locator("data-test-id=post-onboarding-hub-container");
    this.postOnboardingHubActionRowClaimMock = page.locator(
      "data-test-id=postonboarding-action-row-claimMock",
    );
    this.postOnboardingHubActionRowMigrateAssetsMock = page.locator(
      "data-test-id=postonboarding-action-row-migrateAssetsMock",
    );
    this.postOnboardingHubActionRowPersonalizeMock = page.locator(
      "data-test-id=postonboarding-action-row-personalizeMock",
    );

    this.completeActionButton = page.locator("data-test-id=postonboarding-complete-action-button");
    this.postOnboardingBannerEntryPoint = page.locator(
      "data-test-id=postonboarding-banner-entry-point",
    );
    this.postOnboardingBannerEntryPointCloseButton = page.locator(
      "data-test-id=postonboarding-banner-entry-point-close-button",
    );
    this.postOnboardingHubSkipButton = page.locator("data-test-id=postonboarding-hub-skip-button");
    this.postOnboardingHubDrawerSkipButton = page
      .locator("data-test-id=postonboarding-hub-drawer-skip-button")
      .nth(0);
    this.postOnboardingHubExploreButton = page.locator(
      "data-test-id=postonboarding-hub-explore-button",
    );
  }

  async startNewMockPostOnboarding() {
    await this.postOnboardingHubTesterButton.waitFor({ state: "visible" });
    await this.postOnboardingHubTesterButton.click();
  }

  async startClaimMock() {
    await this.postOnboardingHubActionRowClaimMock.click();
    await this.completeActionButton.waitFor({ state: "visible" });
    await this.page.waitForTimeout(300);
  }

  async startMigrateAssetsMock() {
    await this.postOnboardingHubActionRowMigrateAssetsMock.click();
    await this.completeActionButton.waitFor({ state: "visible" });
    await this.page.waitForTimeout(300);
  }

  async startPersonalizeMock() {
    await this.postOnboardingHubActionRowPersonalizeMock.click();
    await this.completeActionButton.waitFor({ state: "visible" });
    await this.page.waitForTimeout(300);
  }

  async skipPostOnboardingHub() {
    await this.postOnboardingHubSkipButton.click();
  }

  async completeActionAndGoToHub() {
    await this.completeActionButton.click();
    await this.sideDrawerContainer.waitFor({ state: "detached" });
  }

  async goPostOnboardingHubFromDashboardBanner() {
    await this.postOnboardingBannerEntryPoint.click();
  }

  async closePostOnboardingHubDashboardBanner() {
    await this.postOnboardingBannerEntryPointCloseButton.click();
  }

  async goToDashboard() {
    await this.postOnboardingHubExploreButton.waitFor({ state: "visible" });
    await this.postOnboardingHubExploreButton.click();
  }
}
