import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";

export class AccountPage extends AppPage {
  readonly settingsButton = this.page.locator("data-test-id=account-settings-button");
  private settingsDeleteButton = this.page.locator("data-test-id=account-settings-delete-button");
  private settingsConfirmButton = this.page.locator("data-test-id=modal-confirm-button");
  private swapButton = this.page.locator("data-test-id=swap-account-action-button");
  private buyButton = this.page.locator("data-test-id=buy-button");
  private sellButton = this.page.locator("data-test-id=sell-button");
  private stakeButton = this.page.locator("data-test-id=stake-from-account-action-button");
  private stakeButtonCosmos = this.page.locator("data-test-id=stake-button-cosmos");
  readonly stakeBanner = this.page.locator("data-test-id=account-stake-banner");
  private stakeBannerButton = this.page.locator("data-test-id=account-stake-banner-button");
  private receiveButton = this.page.locator("data-test-id=receive-account-action-button");
  private sendButton = this.page.getByRole("button", { name: "Send" });
  private accountName = (name: string) => this.page.locator(`text=${name}`);
  private lastOperation = this.page.locator("text=Latest operations");
  private tokenValue = (tokenName: string) =>
    this.page.locator(`data-test-id=account-row-${tokenName.toLowerCase()}`);
  private accountBalance = this.page.locator("data-test-id=total-balance");
  private operationList = this.page.locator("id=operation-list");
  private showMoreButton = this.page.getByText("Show more");
  private advancedButton = this.page.getByText("Advanced");
  private accountAdvancedLogs = this.page.locator("data-test-id=Advanced_Logs");
  private operationRows = this.page.locator("[data-test-id^='operation-row-']");
  private closeModal = this.page.locator("data-test-id=modal-close-button");

  @step("Navigate to token $0")
  async navigateToToken(token: string) {
    await expect(this.tokenValue(token)).toBeVisible();
    await this.tokenValue(token).click();
  }

  @step("Click `Receive` button")
  async clickReceive() {
    await this.receiveButton.click();
  }

  @step("Click `Send` button")
  async clickSend() {
    await this.sendButton.click();
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

  @step("Scroll to operations")
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
  @step("Delete account")
  async deleteAccount() {
    await this.settingsButton.click();
    await this.settingsDeleteButton.click();
    await this.settingsConfirmButton.click();
  }

  @step("Wait for account $0 to be visible")
  async expectAccountVisibility(firstAccountName: string) {
    await expect(this.accountName(firstAccountName)).toBeVisible();
    await this.settingsButton.waitFor({ state: "visible" });
  }

  @step("Expect account to be not null")
  async expectAccountBalance() {
    expect(this.accountBalance).toBeTruthy();
  }

  @step("Expect `Last operations` to be visible")
  async expectLastOperationsVisibility() {
    await this.scrollToOperations();
    await expect(this.lastOperation).toBeVisible();
    await expect(this.operationList).not.toBeEmpty();
  }

  @step("Expect `show more` button to show more operations")
  async expectShowMoreButton() {
    const operationCount = await this.operationRows.count();
    if (await this.showMoreButton.isVisible()) {
      await this.showMoreButton.click();
      const operationCountAfterClick = await this.operationRows.count();
      expect(operationCountAfterClick).toBeGreaterThan(operationCount);
    }
  }

  @step("Expect `derivate address index to be $0` to be visible")
  async expectAddressIndex(indexNumber: number) {
    await this.settingsButton.click();
    await this.advancedButton.click();
    const advancedLogsText = await this.accountAdvancedLogs.innerText();
    const advancedLogsJson = advancedLogsText ? JSON.parse(advancedLogsText) : null;
    expect(advancedLogsJson).toHaveProperty("index", indexNumber);
    await this.closeModal.click();
  }
}
