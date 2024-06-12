import { AppPage } from "tests/page/abstractClasses";

export class PostOnboarding extends AppPage {
  private sideDrawerContainer = this.page.locator("data-test-id=side-drawer-container");
  private postOnboardingHubTesterButton = this.page.locator(
    "data-test-id=postonboarding-tester-button",
  );
  readonly postOnboardingHubContainer = this.page.locator(
    "data-test-id=post-onboarding-hub-container",
  );
  private postOnboardingHubActionRowClaimMock = this.page.locator(
    "data-test-id=postonboarding-action-row-claimMock",
  );
  private postOnboardingHubActionRowMigrateAssetsMock = this.page.locator(
    "data-test-id=postonboarding-action-row-migrateAssetsMock",
  );
  private postOnboardingHubActionRowPersonalizeMock = this.page.locator(
    "data-test-id=postonboarding-action-row-personalizeMock",
  );

  private completeActionButton = this.page.locator(
    "data-test-id=postonboarding-complete-action-button",
  );
  private postOnboardingBannerEntryPoint = this.page.locator(
    "data-test-id=postonboarding-banner-entry-point",
  );
  private postOnboardingHubSkipButton = this.page.locator(
    "data-test-id=postonboarding-hub-skip-button",
  );
  private postOnboardingHubExploreButton = this.page.locator(
    "data-test-id=postonboarding-hub-explore-button",
  );

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

  async goToDashboard() {
    await this.postOnboardingHubExploreButton.waitFor({ state: "visible" });
    await this.postOnboardingHubExploreButton.click();
  }
}
