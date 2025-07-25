import { expect } from "@playwright/test";
import { step } from "../misc/reporters/step";
import { AppPage } from "./abstractClasses";
import { AccountType, getParentAccountName } from "@ledgerhq/live-common/e2e/enum/Account";
import invariant from "invariant";

export class AccountPage extends AppPage {
  readonly settingsButton = this.page.getByTestId("account-settings-button");
  private settingsDeleteButton = this.page.getByTestId("account-settings-delete-button");
  private settingsConfirmButton = this.page.getByTestId("modal-confirm-button");
  private swapButton = this.page.getByTestId("swap-account-action-button");
  private stakeButton = this.page.getByTestId("stake-button");
  private stakeBannerButton = this.page.getByTestId("account-stake-banner-button");
  private receiveButton = this.page.getByRole("button", { name: "Receive", exact: true });
  private sendButton = this.page.getByRole("button", { name: "Send" });
  private buyButton = this.page.getByRole("button", { name: "Buy" });
  private accountName = (name: string) => this.page.locator(`text=${name}`);
  private lastOperation = this.page.locator("text=Latest operations");
  private tokenValue = (tokenName: string, accountName: string) =>
    this.page.getByTestId(`account-row-${tokenName.toLowerCase()}`).getByText(`${accountName}`);
  private accountBalance = this.page.getByTestId("total-balance");
  private operationList = this.page.locator("id=operation-list");
  private showMoreButton = this.page.getByText("Show more");
  private seeMoreCollectionsButton = this.page.getByText("See more collections");
  private advancedButton = this.page.getByText("Advanced");
  private accountAdvancedLogs = this.page.getByTestId("Advanced_Logs");
  private operationRows = this.page.locator("[data-testid^='operation-row-']");
  private operationStatus = this.page.locator("[data-testid^='operation-status-']");
  private selectSpecificOperation = (operationType: string) =>
    this.page.locator("[data-testid^='operation-row-']").filter({ hasText: operationType });
  private closeModal = this.page.getByTestId("modal-close-button");
  private accountButton = (accountName: string) =>
    this.page.getByRole("button", { name: `${accountName}` });
  private tokenRow = (tokenTicker: string) => this.page.getByTestId(`token-row-${tokenTicker}`);
  private addTokenButton = this.page.getByRole("button", { name: "Add token" });
  private viewDetailsButton = this.page.getByText("View details");
  private seeGalleryButton = this.page.getByRole("button", { name: "See Gallery" });
  private nftOperation = this.page.getByText("NFT Sent");
  private nftList = (collectionName: string) => this.page.getByTestId(`nft-row-${collectionName}`);
  private accountChart = this.page.getByTestId("chart-container");
  private editName = this.page.locator("#input-edit-name");
  private applyButton = this.page.getByTestId("account-settings-apply-button");
  private accountHeaderName = this.page.locator("#account-header-name");

  @step("Navigate to token")
  async navigateToToken(account: AccountType) {
    if (account.currency.name) {
      await expect(
        this.tokenValue(account.currency.name, getParentAccountName(account)),
      ).toBeVisible();
      await this.tokenValue(account.currency.name, getParentAccountName(account)).click();
    }
  }

  @step("Click `Receive` button")
  async clickReceive() {
    await this.receiveButton.click();
  }

  @step("Click on add token button")
  async clickAddToken() {
    await this.addTokenButton.click();
  }

  @step("Click `Send` button")
  async clickSend() {
    await this.sendButton.click();
  }

  @step("Verify `Send` button is visible")
  async verifySendButtonVisibility() {
    await expect(this.sendButton).toBeVisible();
  }

  @step("Click `Buy` button")
  async clickBuy() {
    await this.buyButton.click();
  }

  @step("Open Swap")
  async navigateToSwap() {
    await this.swapButton.click();
  }

  @step("Click Stake button")
  async startStakingFlowFromMainStakeButton() {
    await this.stakeButton.click();
  }

  @step("Click on View Details button")
  async navigateToViewDetails() {
    await this.viewDetailsButton.click();
  }

  @step("Click on selected ($0) last operation")
  async selectAndClickOnLastOperation(operation: string) {
    await this.selectSpecificOperation(operation).first().click();
  }

  @step("Click on last operation and return status")
  async clickOnLastOperationAndReturnStatus() {
    const status = await this.operationStatus.first().textContent();
    await this.operationRows.first().click();
    return status;
  }

  @step("Click Stake button on banner")
  async clickBannerCTA() {
    await this.stakeBannerButton.scrollIntoViewIfNeeded();
    await this.stakeBannerButton.click();
  }

  @step("Scroll to operations")
  async scrollToOperations() {
    const operationList = this.page.locator("id=operation-list");
    await operationList.scrollIntoViewIfNeeded();
  }

  @step("Delete account")
  async deleteAccount() {
    await this.settingsButton.click();
    await this.settingsDeleteButton.click();
    await this.settingsConfirmButton.click();
  }

  @step("Rename account")
  async renameAccount(newAccountName: string) {
    await this.settingsButton.click();
    await this.editName.fill(newAccountName);
    await this.applyButton.click();
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
  async expectTokenAccount(account: AccountType) {
    await expect(this.accountButton(account.currency.name)).toBeVisible();
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
  async expectTokenToBePresent(tokenAccount: AccountType) {
    await expect(this.tokenRow(tokenAccount.currency.ticker)).toBeVisible();
    const tokenInfos = await this.tokenRow(tokenAccount.currency.ticker).innerText();
    expect(tokenInfos).toContain(tokenAccount.currency.name);
    expect(tokenInfos).toContain(tokenAccount.currency.ticker);
  }

  @step("Navigate to token in account")
  async navigateToTokenInAccount(tokenAccount: AccountType) {
    await this.tokenRow(tokenAccount.currency.ticker).click();
  }

  @step("Navigate to NFT gallery")
  async navigateToNFTGallery() {
    await this.seeGalleryButton.click();
  }

  @step("Navigate to NFT operation")
  async navigateToNFTOperation() {
    await this.nftOperation.click();
  }

  @step("Expect NFT list to be visible")
  async checkNftListInAccount(account: AccountType) {
    invariant(account.nft && account.nft.length > 0, "No NFT found in account");

    for (const nft of account.nft) {
      const nftLocator = this.nftList(nft.collectionName);
      if (await this.seeMoreCollectionsButton.isVisible()) {
        await this.seeMoreCollectionsButton.click();
      }
      await expect(nftLocator).toBeVisible();
    }
  }

  @step("Check account chart is visible")
  async checkAccountChart() {
    await this.accountChart.waitFor({ state: "visible" });
  }

  @step("Verify account with header name $0 is visible")
  async verifyAccountHeaderNameIsVisible(headerName: string) {
    await expect(this.accountHeaderName).toHaveValue(headerName);
  }
}
