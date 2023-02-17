import { Page, Locator } from "@playwright/test";

export class AccountPage {
  readonly page: Page;
  readonly buttonsGroup: Locator;
  readonly settingsButton: Locator;
  readonly swapButton: Locator;
  readonly stakeButton: Locator;
  readonly bannerButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.buttonsGroup = page.locator("data-test-id=account-buttons-group");
    this.settingsButton = page.locator("data-test-id=account-settings-button");
    this.swapButton = page.locator("data-test-id=swap-account-action-button");
    this.stakeButton = page.locator("data-test-id=stake-from-account-action-button");
    this.bannerButton = page.locator("data-test-id=account-banner-button"); // could be multiple banners so need a better way to do this
  }

  async navigateToSwap() {
    await this.swapButton.click();
  }

  async startStakingFlowFromMainStakeButton() {
    await this.stakeButton.click();
  }

  async clickBannerCTA() {
    await this.bannerButton.click();
  }
}
