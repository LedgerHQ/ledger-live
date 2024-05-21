import { Page, Locator } from "@playwright/test";

export class AccountPage {
  readonly page: Page;
  readonly buttonsGroup: Locator;
  readonly settingsButton: Locator;
  readonly settingsDeleteButton: Locator;
  readonly settingsConfirmButton: Locator;
  readonly swapButton: Locator;
  readonly buyButton: Locator;
  readonly sellButton: Locator;
  readonly stakeButton: Locator;
  readonly stakeBanner: Locator;
  readonly stakeBannerButton: Locator;
  readonly stakeButtonCosmos: Locator;
  readonly receiveButton: Locator;
  readonly sendButton: Locator;
  readonly accountName: (name: string) => Locator;
  readonly lastOperation: Locator;
  readonly tokenValue: (tokenName: string) => Locator;

  constructor(page: Page) {
    this.page = page;
    this.buttonsGroup = page.locator("data-test-id=account-buttons-group");
    this.settingsButton = page.locator("data-test-id=account-settings-button");
    this.settingsDeleteButton = page.locator("data-test-id=account-settings-delete-button");
    this.settingsConfirmButton = page.locator("data-test-id=modal-confirm-button");
    this.swapButton = page.locator("data-test-id=swap-account-action-button");
    this.buyButton = page.locator("data-test-id=buy-button");
    this.sellButton = page.locator("data-test-id=sell-button");
    this.stakeButton = page.locator("data-test-id=stake-from-account-action-button");
    this.stakeButtonCosmos = page.locator("data-test-id=stake-button-cosmos");
    this.stakeBanner = page.locator("data-test-id=account-stake-banner");
    this.stakeBannerButton = page.locator("data-test-id=account-stake-banner-button");
    this.receiveButton = page.locator("data-test-id=receive-account-action-button");
    this.sendButton = page.getByRole("button", { name: "Send" });
    this.accountName = name => page.locator(`text=${name}`);
    this.lastOperation = page.locator("text=Latest operations");
    this.tokenValue = tokenName =>
      page.locator(`data-test-id=account-row-${tokenName.toLowerCase()}`);
  }

  async navigateToToken(token: string) {
    await this.tokenValue(token).click();
  }

  async navigateToSwap() {
    await this.swapButton.click();
  }

  async navigateToBuy() {
    await this.buyButton.click();
  }

  async navigateToSell() {
    await this.sellButton.click();
  }

  async startStakingFlowFromMainStakeButton() {
    await this.stakeButton.click();
  }

  async clickBannerCTA() {
    await this.stakeBannerButton.scrollIntoViewIfNeeded();
    await this.stakeBannerButton.click();
  }

  async scrollToOperations() {
    const operationList = this.page.locator("id=operation-list");
    await operationList.scrollIntoViewIfNeeded();
  }

  async startCosmosStakingFlow() {
    await this.stakeButtonCosmos.click();
  }

  /**
   * Delete account from account itself
   */
  async deleteAccount() {
    await this.settingsButton.click();
    await this.settingsDeleteButton.click();
    await this.settingsConfirmButton.click();
  }
}
