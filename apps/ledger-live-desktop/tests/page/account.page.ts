import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import { Token } from "tests/enum/Tokens";

export class AccountPage extends AppPage {
  readonly settingsButton = this.page.getByTestId("account-settings-button");
  private settingsDeleteButton = this.page.getByTestId("account-settings-delete-button");
  private settingsConfirmButton = this.page.getByTestId("modal-confirm-button");
  private swapButton = this.page.getByTestId("swap-account-action-button");
  private buyButton = this.page.getByTestId("buy-button");
  private sellButton = this.page.getByTestId("sell-button");
  private stakeButton = this.page.getByTestId("stake-from-account-action-button");
  private stakeButtonCosmos = this.page.getByTestId("stake-button-cosmos");
  readonly stakeBanner = this.page.getByTestId("account-stake-banner");
  private stakeBannerButton = this.page.getByTestId("account-stake-banner-button");
  private receiveButton = this.page.getByTestId("receive-account-action-button");
  private sendButton = this.page.getByRole("button", { name: "Send" });
  private accountName = (name: string) => this.page.locator(`text=${name}`);
  private lastOperation = this.page.locator("text=Latest operations");
  private tokenValue = (tokenName: string) =>
    this.page.getByTestId(`account-row-${tokenName.toLowerCase()}`);
  private accountBalance = this.page.getByTestId("total-balance");
  private operationList = this.page.locator("id=operation-list");
  private showMoreButton = this.page.getByText("Show more");
  private advancedButton = this.page.getByText("Advanced");
  private accountAdvancedLogs = this.page.getByTestId("Advanced_Logs");
  private operationRows = this.page.locator("[data-test-id^='operation-row-']");
  private closeModal = this.page.getByTestId("modal-close-button");
  private accountbutton = (accountName: string) =>
    this.page.getByRole("button", { name: `${accountName}` });
  private tokenRow = (tokenTicker: string) => this.page.getByTestId(`token-row-${tokenTicker}`);
  private addTokenButton = this.page.getByRole("button", { name: "Add token" });

  @step("Navigate to token $0")
  async navigateToToken(token: Token) {
    await expect(this.tokenValue(token.tokenName)).toBeVisible();
    await this.tokenValue(token.tokenName).click();
  }

  @step("Click `Receive` button")
  async clickReceive() {
    await this.receiveButton.click();
  }

  @step("click on add token button")
  async clickAddToken() {
    await this.addTokenButton.click();
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

  @step("Expect token Account to be visible")
  async expectTokenAccount(token: Token) {
    await expect(this.accountbutton(token.parentAccount.accountName)).toBeVisible();
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

  @step("Expect token to be present")
  async expectTokenToBePresent(token: Token) {
    await expect(this.tokenRow(token.tokenTicker)).toBeVisible();
    const tokenInfos = await this.tokenRow(token.tokenTicker).innerText();
    expect(tokenInfos).toContain(token.tokenName);
    expect(tokenInfos).toContain(token.tokenTicker);
  }
}
