import { Page, Locator } from "@playwright/test";

export class AccountPage {
  readonly page: Page;
  readonly buttonsGroup: Locator;
  readonly settingsButton: Locator;
  readonly swapButton: Locator;
  readonly stakeButton: Locator;
  readonly stakeBanner: Locator;
  readonly stakeBannerButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.buttonsGroup = page.locator("data-test-id=account-buttons-group");
    this.settingsButton = page.locator("data-test-id=account-settings-button");
    this.swapButton = page.locator("data-test-id=swap-account-action-button");
    this.stakeButton = page.locator("data-test-id=stake-from-account-action-button");
    this.stakeBanner = page.locator("data-test-id=account-stake-banner");
    this.stakeBannerButton = page.locator("data-test-id=account-stake-banner-button");
  }

  async navigateToSwap() {
    await this.swapButton.click();
  }

  async startStakingFlowFromMainStakeButton() {
    await this.stakeButton.click();
  }

  async clickBannerCTA() {
    await this.stakeBannerButton.click();
  }
}
