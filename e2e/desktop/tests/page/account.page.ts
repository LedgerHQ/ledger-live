import { expect, type Locator } from "@playwright/test";
import { Layout } from "tests/component/layout.component";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import { AccountDetailPage, type EarnOptions } from "tests/page/accountDetail.page";
import { AccountType } from "@ledgerhq/live-e2e-shared/enum/Account";
import type { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { isAccountDetailEnabled } from "tests/utils/featureFlagUtils";
import { escapeRegExp } from "tests/utils/regExpUtils";

export class AccountPage extends AppPage {
  private readonly layout = new Layout(this.page);
  private readonly accountDetail = new AccountDetailPage(this.page);
  readonly settingsButton = this.page.getByTestId("account-settings-button");
  private settingsDeleteButton = this.page.getByTestId("account-settings-delete-button");
  private settingsConfirmButton = this.page.getByTestId("modal-confirm-button");
  private swapButton = this.page.getByTestId("swap-account-action-button");
  private stakeButton = this.page.getByTestId("stake-button");
  private receiveButton = this.page.getByRole("button", { name: "Receive", exact: true });
  private activatePrivateBalanceButton = this.page.getByTestId("show-private-balance-button");
  private sendButton = this.page.getByRole("button", { name: "Send" });
  private buyButton = this.page.getByRole("button", { name: "Buy" });
  private accountName = this.page.locator("#account-header-name");
  private lastOperation = this.page.locator("text=Latest operations");
  private tokenValue = (tokenName: string) =>
    this.page.getByTestId(`account-row-${tokenName.toLowerCase()}`);
  private tokenRowByTicker = (tokenTicker: string) =>
    this.page.getByTestId(`account-row-${tokenTicker.toLowerCase()}`);
  private accountBalance = this.page.getByTestId("total-balance");
  private operationList = this.page.locator("id=operation-list");
  private showMoreButton = this.page.getByText("Show more");
  private advancedButton = this.page.getByText("Advanced");
  private accountAdvancedLogs = this.page.getByTestId("Advanced_Logs");
  private operationRows = this.page.locator("[data-testid^='operation-row-']");
  private operationStatus = this.page.locator("[data-testid^='operation-status-']");
  private closeModal = this.page.getByTestId("modal-close-button");
  private tokenRow = (tokenTicker: string) => this.page.getByTestId(`token-row-${tokenTicker}`);
  private showAllTokensButton = this.page.getByTestId("account-tokens-show-all-button");
  private addTokenButton = this.page.getByRole("button", { name: "Add token" });
  private viewDetailsButton = this.page.getByText("View details");
  private editName = this.page.locator("#input-edit-name");
  private applyButton = this.page.getByTestId("account-settings-apply-button");
  private accountChart = this.page.getByTestId("chart-container");
  private selectSpecificOperation = (operationType: string) =>
    this.page.locator("[data-testid^='operation-row-']").filter({ hasText: operationType });
  private readonly noAssetsTitle = this.page.getByTestId("no-assets-title");

  // Case-insensitive: asset names come from the cryptoasset list and don't always match the
  // casing declared in the Currency enum (e.g. "dogwifhat" vs "DOGWIFHAT").
  private accountHeaderNamePattern(...names: string[]) {
    const escaped = names.map(name => escapeRegExp(name.trim()));
    return new RegExp(`^(${escaped.join("|")})$`, "i");
  }

  @step("Click `Receive` button")
  async clickReceive() {
    if (await isAccountDetailEnabled(this.page)) {
      await this.accountDetail.clickReceive();
      return;
    }
    await this.receiveButton.click();
  }

  @step("Click `Show balance` button")
  async clickShowBalance() {
    if (await this.activatePrivateBalanceButton.isVisible()) {
      await this.activatePrivateBalanceButton.click();
    }
  }

  @step("Click on add token button")
  async clickAddToken(parent: Currency) {
    if (await isAccountDetailEnabled(this.page)) {
      await this.accountDetail.clickAddToken(parent);
      return;
    }
    await this.addTokenButton.click();
  }

  @step("Click `Send` button")
  async clickSend(asset?: Currency) {
    if (await isAccountDetailEnabled(this.page)) {
      await this.accountDetail.clickSend(asset);
      return;
    }
    if (await this.noAssetsTitle.isVisible()) {
      await this.layout.syncAccounts();
      await this.layout.waitForSyncButtonToBeEnabled();
    }
    await this.sendButton.click();
  }

  @step("Verify `Send` button is visible")
  async verifySendButtonVisibility() {
    if (await isAccountDetailEnabled(this.page)) {
      await this.accountDetail.expectSendVisible();
      return;
    }
    await expect(this.sendButton).toBeVisible();
  }

  @step("Verify `Receive` button is visible")
  async verifyReceiveButtonVisibility() {
    if (await isAccountDetailEnabled(this.page)) {
      await this.accountDetail.expectReceiveVisible();
      return;
    }
    await expect(this.receiveButton).toBeVisible();
  }

  @step("Expect account header (name + settings) to be visible")
  async expectAccountHeaderVisible() {
    if (await isAccountDetailEnabled(this.page)) {
      await this.accountDetail.expectHeaderVisible();
      return;
    }
    await expect(this.accountName).toBeVisible();
    await expect(this.settingsButton).toBeVisible();
  }

  @step("Click `Buy` button")
  async clickBuy(asset?: AccountType) {
    if (await isAccountDetailEnabled(this.page)) {
      await this.accountDetail.clickBuy(asset);
      return;
    }
    await this.buyButton.click();
  }

  @step("Get the swap surface of the account page")
  async swapSurface(): Promise<"full" | "embedded"> {
    return (await isAccountDetailEnabled(this.page)) ? "embedded" : "full";
  }

  @step("Open Swap")
  async navigateToSwap() {
    if (await isAccountDetailEnabled(this.page)) return;
    await this.swapButton.click();
  }

  @step("Click Stake button")
  async startStakingFlowFromMainStakeButton({ asset, ...syncOptions }: EarnOptions) {
    if (await isAccountDetailEnabled(this.page)) {
      await this.accountDetail.clickEarn({ asset, ...syncOptions });
      return;
    }
    // Wait if a sync is in progress to avoid empty stake modal
    await this.layout.waitForSyncButtonToBeEnabled(syncOptions);
    await this.stakeButton.click();
  }

  @step("Click on View Details button")
  async navigateToViewDetails() {
    await this.viewDetailsButton.click();
  }

  @step("Click on last operation and return status")
  async clickOnLastOperationAndReturnStatus(operationType?: string): Promise<string> {
    if (await isAccountDetailEnabled(this.page)) {
      return this.accountDetail.clickLastOperationAndReturnStatus(operationType);
    }

    const status = await this.operationStatus.first().textContent();
    if (!status) {
      throw new Error("Expected operation status to be defined");
    }

    await this.operationRows.first().click();
    return status;
  }

  @step("Scroll to operations")
  private async scrollToOperations() {
    const operationList = this.page.locator("id=operation-list");
    // Wait for the operation list to be attached and stable before scrolling (React 19 deferred rendering)
    await operationList.waitFor({ state: "attached" });
    await operationList.scrollIntoViewIfNeeded();
  }

  @step("Delete account")
  async deleteAccount() {
    if (await isAccountDetailEnabled(this.page)) {
      await this.accountDetail.remove();
      return;
    }
    await this.settingsButton.click();
    await this.settingsDeleteButton.click();
    await this.settingsConfirmButton.click();
  }

  @step("Rename account")
  async renameAccount(newAccountName: string) {
    if (await isAccountDetailEnabled(this.page)) {
      await this.accountDetail.rename(newAccountName);
      return;
    }
    await this.settingsButton.click();
    await this.editName.fill(newAccountName);
    await this.applyButton.click();
  }

  @step("Wait for account $0 to be visible")
  async expectAccountVisibility(firstAccountName: string) {
    if (await isAccountDetailEnabled(this.page)) {
      this.accountDetail.forgetToken();
      await this.accountDetail.expectName(this.accountHeaderNamePattern(firstAccountName));
      await this.accountDetail.expectSettingsVisible();
      return;
    }
    await expect(this.accountName).toHaveValue(this.accountHeaderNamePattern(firstAccountName));
    await expect(this.settingsButton).toBeVisible();
  }

  @step("Expect account to be not null")
  async expectAccountBalance() {
    if (await isAccountDetailEnabled(this.page)) {
      await this.accountDetail.expectBalance();
      return;
    }
    await expect(this.accountBalance).toBeVisible();
  }

  @step("Expect `Last operations` to be visible")
  async expectLastOperationsVisibility() {
    if (await isAccountDetailEnabled(this.page)) {
      await this.accountDetail.expectTransactions();
      return;
    }
    await this.scrollToOperations();
    await expect(this.lastOperation).toBeVisible();
    await expect(this.operationList).not.toBeEmpty();
  }

  @step("Expect funded account details for $0")
  async expectFundedAccountDetails(accountName: string): Promise<string> {
    await this.expectAccountVisibility(accountName);
    await this.expectAccountBalance();
    await this.expectLastOperationsVisibility();
    return this.clickOnLastOperationAndReturnStatus();
  }

  @step("Expect token Account to be visible")
  async expectTokenAccount(account: AccountType) {
    if (await isAccountDetailEnabled(this.page)) {
      await this.accountDetail.expectToken(account);
      return;
    }
    await this.waitForAccountHeaderName(account.currency.name, account.currency.ticker);
  }

  @step("Expect `show more` button to show more operations")
  async expectShowMoreButton() {
    if (await isAccountDetailEnabled(this.page)) {
      await this.accountDetail.expectFullHistoryLink();
      return;
    }
    const operationCount = await this.operationRows.count();
    if (await this.showMoreButton.isVisible()) {
      await this.showMoreButton.click();
      const operationCountAfterClick = await this.operationRows.count();
      expect(operationCountAfterClick).toBeGreaterThan(operationCount);
    }
  }

  @step("Expect `derivate address index to be $0` to be visible")
  async expectAddressIndex(indexNumber: number) {
    if (await isAccountDetailEnabled(this.page)) {
      await this.accountDetail.expectAddressIndex(indexNumber);
      return;
    }
    await this.settingsButton.click();
    await this.advancedButton.click();
    const advancedLogsText = await this.accountAdvancedLogs.innerText();
    const advancedLogsJson = advancedLogsText ? JSON.parse(advancedLogsText) : null;
    expect(advancedLogsJson).toHaveProperty("index", indexNumber);
    await this.closeModal.click();
  }

  private async revealTokenRow(row: Locator) {
    await expect(this.showAllTokensButton.or(row).first()).toBeVisible();
    if (!(await row.isVisible())) {
      await this.showAllTokensButton.click();
    }
  }

  @step("Expect token to be present")
  async expectTokenToBePresent(tokenAccount: AccountType) {
    if (await isAccountDetailEnabled(this.page)) {
      await this.accountDetail.expectToken(tokenAccount);
      return;
    }
    const row = this.tokenRow(tokenAccount.currency.ticker);
    await this.revealTokenRow(row);
    await expect(row).toBeVisible();
  }

  @step("Navigate to token in account")
  async navigateToTokenInAccount(tokenAccount: AccountType) {
    if (await isAccountDetailEnabled(this.page)) {
      await this.accountDetail.selectToken(tokenAccount);
      return;
    }
    const row = this.tokenRow(tokenAccount.currency.ticker);
    await this.revealTokenRow(row);
    await row.click();
    await this.waitForAccountHeaderName(tokenAccount.currency.name, tokenAccount.currency.ticker);
  }

  @step("Wait for account header name $0 to be visible")
  async waitForAccountHeaderName(headerName: string, fallbackName?: string) {
    const pattern = fallbackName
      ? this.accountHeaderNamePattern(headerName, fallbackName)
      : this.accountHeaderNamePattern(headerName);
    await this.expectHeaderName(pattern);
  }

  @step("Verify account with header name $0 is visible")
  async verifyAccountHeaderNameIsVisible(headerName: string) {
    await this.expectHeaderName(this.accountHeaderNamePattern(headerName));
  }

  private async expectHeaderName(pattern: RegExp) {
    if (!(await isAccountDetailEnabled(this.page))) {
      await expect(this.accountName).toHaveValue(pattern);
      return;
    }
    if (this.accountDetail.hasSelectedToken()) {
      await this.accountDetail.expectParentOfToken();
      return;
    }
    await this.accountDetail.expectName(pattern);
  }
}
