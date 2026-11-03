import { expect, type Locator } from "@playwright/test";
import { Layout, type SyncWaitOptions } from "tests/component/layout.component";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import { AccountType } from "@ledgerhq/live-e2e-shared/enum/Account";
import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";

const escapeRegExp = (value: string) => value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

export class AccountPage extends AppPage {
  private readonly layout = new Layout(this.page);
  readonly settingsButton = this.page
    .getByTestId("account-settings-button")
    .or(this.page.getByTestId("account-detail-header-settings"));
  private redesignedLayout = this.page.getByTestId("account-detail-layout");
  private redesignedTitle = this.page.getByTestId("page-header-title");
  private redesignedHeroAction = (action: string) =>
    this.page.getByTestId(`account-detail-hero-actions-${action}`);
  private redesignedOperationRows = this.page.locator("[data-testid^='history-operation-row-']");
  private redesignedOperationType = this.page.getByTestId("history-operation-type");
  private redesignedAssets = this.page.getByTestId("account-detail-assets");
  private tokenInFocus?: string;
  // A row reads "Tether USD USDT 65.54 USDT $65.44 ...", the ticker followed by a balance tells it apart from tokens named after it.
  private redesignedTokenRow = (tokenAccount: AccountType) =>
    this.redesignedAssets.getByRole("button", {
      name: new RegExp(String.raw`\b${escapeRegExp(tokenAccount.currency.ticker)} \d`),
    });
  private redesignedBalance = this.page.getByTestId("account-detail-hero-balance");
  private redesignedTransactions = this.page.getByTestId("account-detail-transactions-section");
  private redesignedMenuEntry = (entry: string) =>
    this.page.getByTestId(`account-settings-${entry}`);
  private redesignedNameInput = this.page.getByTestId("account-settings-change-name-input");
  private redesignedChangeNameButton = this.page.getByRole("button", { name: "Change name" });
  private redesignedAdvancedLogsJson = this.page.getByTestId("account-settings-advanced-logs-json");
  private redesignedRemoveConfirm = this.page.getByTestId("account-settings-remove-confirm");
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
    const escaped = names.map(n => n.trim().replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`));
    return new RegExp(`^(${escaped.join("|")})$`, "i");
  }

  // The same specs run with the `accountDetail` flag on and off, so each method follows the page it lands on.
  private async isRedesigned() {
    await expect(this.redesignedLayout.or(this.accountName)).toBeVisible();
    return this.redesignedLayout.isVisible();
  }

  private async clickAction(action: string, legacyButton: Locator, assetCurrencyId?: string) {
    if (await this.isRedesigned()) {
      await this.redesignedHeroAction(action).click();
      await this.pickAssetIfAsked(assetCurrencyId);
      return;
    }
    await legacyButton.click();
  }

  // Buy opens the modular asset selector, which lists "Ethereum ETH $2,286.45 +0.15%".
  private async pickAssetInSelector(asset: AccountType) {
    const { name, ticker } = asset.currency;
    const option = this.page
      .getByRole("dialog")
      .getByRole("button", { name: new RegExp(`^${escapeRegExp(name)} ${escapeRegExp(ticker)} `) });
    try {
      await option.first().waitFor({ state: "visible", timeout: TIMEOUT.small });
    } catch {
      return; // a single asset opens the flow straight away
    }
    await option.first().click();
  }

  // The new page asks which asset to use when the account holds several.
  private async pickAssetIfAsked(assetCurrencyId?: string) {
    const currencyId = assetCurrencyId ?? this.tokenInFocus;
    if (!currencyId) return;
    const pickerRow = this.page.getByTestId(`account-detail-asset-picker-${currencyId}`);
    try {
      await pickerRow.waitFor({ state: "visible", timeout: TIMEOUT.small });
    } catch {
      return; // a single asset opens the flow straight away
    }
    await pickerRow.click();
  }

  @step("Click `Receive` button")
  async clickReceive() {
    await this.clickAction("receive", this.receiveButton);
  }

  @step("Click `Show balance` button")
  async clickShowBalance() {
    if (await this.activatePrivateBalanceButton.isVisible()) {
      await this.activatePrivateBalanceButton.click();
    }
  }

  @step("Click on add token button")
  async clickAddToken() {
    await this.addTokenButton.click();
  }

  @step("Click `Send` button")
  async clickSend(assetCurrencyId?: string) {
    if (await this.isRedesigned()) {
      await this.clickRedesignedSend(assetCurrencyId);
      return;
    }
    if (await this.noAssetsTitle.isVisible()) {
      await this.layout.syncAccounts();
      await this.layout.waitForSyncButtonToBeEnabled();
    }
    await this.sendButton.click();
  }

  // Send stays disabled until the account is synced.
  private async clickRedesignedSend(assetCurrencyId?: string) {
    const send = this.redesignedHeroAction("send");
    if (await send.isDisabled()) {
      await this.layout.syncAccounts();
      await this.layout.waitForSyncButtonToBeEnabled();
    }
    await send.click();
    await this.pickAssetIfAsked(assetCurrencyId);
  }

  @step("Verify `Send` button is visible")
  async verifySendButtonVisibility() {
    await expect(
      (await this.isRedesigned()) ? this.redesignedHeroAction("send") : this.sendButton,
    ).toBeVisible();
  }

  @step("Verify `Receive` button is visible")
  async verifyReceiveButtonVisibility() {
    await expect(
      (await this.isRedesigned()) ? this.redesignedHeroAction("receive") : this.receiveButton,
    ).toBeVisible();
  }

  @step("Expect account header (name + settings) to be visible")
  async expectAccountHeaderVisible() {
    await expect(this.redesignedTitle.or(this.accountName)).toBeVisible();
    await expect(this.settingsButton).toBeVisible();
  }

  @step("Click `Buy` button")
  async clickBuy(asset?: AccountType) {
    if (await this.isRedesigned()) {
      await this.redesignedHeroAction("buy").click();
      if (asset) await this.pickAssetInSelector(asset);
      return;
    }
    await this.buyButton.click();
  }

  @step("Get the swap surface of the account page")
  async swapSurface(): Promise<"full" | "embedded"> {
    return (await this.isRedesigned()) ? "embedded" : "full";
  }

  @step("Open Swap")
  async navigateToSwap() {
    // The new page embeds the swap console, there is nothing to open.
    if (await this.isRedesigned()) return;
    await this.swapButton.click();
  }

  @step("Click Stake button")
  async startStakingFlowFromMainStakeButton(options?: SyncWaitOptions) {
    // Wait if a sync is in progress to avoid empty stake modal
    await this.layout.waitForSyncButtonToBeEnabled(options);
    await this.stakeButton.click();
  }

  @step("Click on View Details button")
  async navigateToViewDetails() {
    await this.viewDetailsButton.click();
  }

  @step("Click on last operation and return status")
  async clickOnLastOperationAndReturnStatus(): Promise<string> {
    if (await this.isRedesigned()) {
      // The recent transactions rows only tell a failed operation apart, as the drawer expects.
      const type = await this.redesignedOperationType.first().textContent();
      await this.redesignedOperationRows.first().click();
      return type?.includes("Failed") ? "Failed" : "Confirmed";
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
    await this.settingsButton.click();
    if (await this.isRedesigned()) {
      await this.redesignedMenuEntry("remove-account").click();
      await this.redesignedRemoveConfirm.click();
      return;
    }
    await this.settingsDeleteButton.click();
    await this.settingsConfirmButton.click();
  }

  @step("Rename account")
  async renameAccount(newAccountName: string) {
    await this.settingsButton.click();
    if (await this.isRedesigned()) {
      await this.redesignedMenuEntry("change-name").click();
      await this.redesignedNameInput.fill(newAccountName);
      await this.redesignedChangeNameButton.click();
      return;
    }
    await this.editName.fill(newAccountName);
    await this.applyButton.click();
  }

  @step("Wait for account $0 to be visible")
  async expectAccountVisibility(firstAccountName: string) {
    await this.expectHeaderName(this.accountHeaderNamePattern(firstAccountName));
    await expect(this.settingsButton).toBeVisible();
  }

  @step("Expect account to be not null")
  async expectAccountBalance() {
    await expect(
      (await this.isRedesigned()) ? this.redesignedBalance : this.accountBalance,
    ).toBeVisible();
  }

  @step("Expect `Last operations` to be visible")
  async expectLastOperationsVisibility() {
    if (await this.isRedesigned()) {
      await this.redesignedTransactions.scrollIntoViewIfNeeded();
      await expect(this.redesignedTransactions).toBeVisible();
      await expect(this.redesignedOperationRows.first()).toBeVisible();
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
    if (await this.isRedesigned()) {
      // A token has no page of its own, it stays in the assets of its parent account.
      await this.expectTokenToBePresent(account);
      return;
    }
    await this.waitForAccountHeaderName(account.currency.name, account.currency.ticker);
  }

  @step("Expect `show more` button to show more operations")
  async expectShowMoreButton() {
    // The recent transactions section has no "Show more", it links to the full history instead.
    if (await this.isRedesigned()) return;
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
    const redesigned = await this.isRedesigned();
    if (redesigned) {
      await this.redesignedMenuEntry("advanced-logs").click();
    } else {
      await this.advancedButton.click();
    }
    const advancedLogsText = await (
      redesigned ? this.redesignedAdvancedLogsJson : this.accountAdvancedLogs
    ).innerText();
    const advancedLogsJson = advancedLogsText ? JSON.parse(advancedLogsText) : null;
    expect(advancedLogsJson).toHaveProperty("index", indexNumber);
    if (redesigned) {
      await this.page.keyboard.press("Escape");
    } else {
      await this.closeModal.click();
    }
  }

  private async revealTokenRow(row: Locator) {
    await expect(this.showAllTokensButton.or(row).first()).toBeVisible();
    if (!(await row.isVisible())) {
      await this.showAllTokensButton.click();
    }
  }

  @step("Expect token to be present")
  async expectTokenToBePresent(tokenAccount: AccountType) {
    if (await this.isRedesigned()) {
      await expect(this.redesignedTokenRow(tokenAccount)).toBeVisible();
      return;
    }
    const row = this.tokenRow(tokenAccount.currency.ticker);
    await this.revealTokenRow(row);
    await expect(row).toBeVisible();
  }

  @step("Navigate to token in account")
  async navigateToTokenInAccount(tokenAccount: AccountType) {
    if (await this.isRedesigned()) {
      // A row opens the asset page, so the token is kept to pick it when sending or buying.
      await this.expectTokenToBePresent(tokenAccount);
      this.tokenInFocus = tokenAccount.currency.id;
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
    if (await this.isRedesigned()) {
      // A token has no page of its own, the header stays the one of its parent account.
      if (this.tokenInFocus) {
        await expect(this.redesignedLayout).toBeVisible();
        return;
      }
      await expect(this.redesignedTitle).toHaveText(pattern);
    } else {
      await expect(this.accountName).toHaveValue(pattern);
    }
  }
}
