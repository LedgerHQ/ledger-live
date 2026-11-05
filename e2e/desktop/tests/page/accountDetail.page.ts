import { errors, expect, type Locator } from "@playwright/test";
import { Layout, type SyncWaitOptions } from "tests/component/layout.component";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import { ModularAssetDialog } from "tests/page/dialog/modular.asset.dialog";
import type { AccountType } from "@ledgerhq/live-e2e-shared/enum/Account";
import type { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";
import { escapeRegExp } from "tests/utils/regExpUtils";

export type EarnOptions = SyncWaitOptions & { asset?: Currency };

/** The account page shown when the `accountDetail` flag is on. */
export class AccountDetailPage extends AppPage {
  private readonly layout = new Layout(this.page);
  private readonly modularAssetDialog = new ModularAssetDialog(this.page);
  private readonly accountDetailLayout = this.page.getByTestId("account-detail-layout");
  private readonly title = this.page.getByTestId("page-header-title");
  private readonly settingsButton = this.page.getByTestId("account-detail-header-settings");
  private readonly heroAction = (action: string) =>
    this.page.getByTestId(`account-detail-hero-actions-${action}`);
  private readonly balance = this.page.getByTestId("account-detail-hero-balance");
  private readonly assets = this.page.getByTestId("account-detail-assets");
  private readonly addAssetButton = this.page.getByTestId("account-detail-add-asset");
  private readonly tokenRow = (token: AccountType) =>
    this.assets.getByRole("button", {
      name: new RegExp(String.raw`\b${escapeRegExp(token.currency.ticker)} \d`),
    });
  private readonly transactions = this.page.getByTestId("account-detail-transactions-section");
  private readonly transactionsHeader = this.page.getByTestId("account-detail-transactions-header");
  private readonly operationRows = this.page.locator("[data-testid^='history-operation-row-']");
  private readonly operationType = this.page.getByTestId("history-operation-type");
  private readonly accountPicker = this.page.getByTestId("account-detail-asset-picker");
  private readonly accountPickerRow = (currency: Currency) =>
    this.page
      .locator("[data-testid^='account-detail-asset-picker-']")
      .filter({ has: this.page.getByText(currency.ticker, { exact: true }) })
      .first();
  private readonly firstAccountPickerRow = this.page
    .locator("[data-testid^='account-detail-asset-picker-']")
    .first();
  private readonly settingsEntry = (entry: string) =>
    this.page.getByTestId(`account-settings-${entry}`);
  private readonly nameInput = this.page.getByTestId("account-settings-change-name-input");
  private readonly changeNameButton = this.page.getByRole("button", { name: "Change name" });
  private readonly advancedLogsJson = this.page.getByTestId("account-settings-advanced-logs-json");
  private readonly removeConfirmButton = this.page.getByTestId("account-settings-remove-confirm");

  private tokenInFocus?: Currency;

  async isDisplayedRatherThan(previousPageMarker: Locator) {
    await expect(this.accountDetailLayout.or(previousPageMarker)).toBeVisible();
    return this.accountDetailLayout.isVisible();
  }

  @step("Click `Receive` button")
  async clickReceive() {
    await this.heroAction("receive").click();
  }

  @step("Click `Buy` button")
  async clickBuy(asset?: AccountType) {
    await this.heroAction("buy").click();
    const currency = asset?.currency ?? this.tokenInFocus;
    if (currency) {
      await this.modularAssetDialog.selectAssetByTicker(currency);
    }
  }

  @step("Click `Earn` button")
  async clickEarn({ asset, ...syncOptions }: EarnOptions = {}) {
    await this.layout.waitForSyncButtonToBeEnabled(syncOptions);
    await this.heroAction("earn").click();
    await this.clickWhenDisplayed(
      this.firstAccountPickerRow,
      asset ? this.accountPickerRow(asset) : this.firstAccountPickerRow,
    );
  }

  @step("Click `Send` button")
  async clickSend(asset?: Currency) {
    const send = this.heroAction("send");
    if (await send.isDisabled()) {
      await this.layout.syncAccounts();
      await this.layout.waitForSyncButtonToBeEnabled();
    }
    await send.click();
    const currency = asset ?? this.tokenInFocus;
    if (currency) {
      await this.clickWhenDisplayed(this.accountPicker, this.accountPickerRow(currency));
    }
  }

  @step("Click on add token button")
  async clickAddToken() {
    await expect(this.accountDetailLayout).toBeVisible();
    const hasAddAssetAction = await this.addAssetButton.isVisible();
    await (hasAddAssetAction ? this.addAssetButton : this.heroAction("receive")).click();
  }

  @step("Expect `Send` button to be visible")
  async expectSendVisible() {
    await expect(this.heroAction("send")).toBeVisible();
  }

  @step("Expect `Receive` button to be visible")
  async expectReceiveVisible() {
    await expect(this.heroAction("receive")).toBeVisible();
  }

  @step("Expect account header (name + settings) to be visible")
  async expectHeaderVisible() {
    await expect(this.title).toBeVisible();
    await expect(this.settingsButton).toBeVisible();
  }

  @step("Expect account name to match $0")
  async expectName(pattern: RegExp) {
    await expect(this.title).toHaveText(pattern);
  }

  @step("Expect account settings button to be visible")
  async expectSettingsVisible() {
    await expect(this.settingsButton).toBeVisible();
  }

  @step("Expect the account page of the parent of a token")
  async expectParentOfToken() {
    await expect(this.accountDetailLayout).toBeVisible();
  }

  @step("Expect account balance to be visible")
  async expectBalance() {
    await expect(this.balance).toBeVisible();
  }

  @step("Expect recent transactions to be visible")
  async expectTransactions() {
    await this.transactions.scrollIntoViewIfNeeded();
    await expect(this.transactions).toBeVisible();
    await expect(this.operationRows.first()).toBeVisible();
  }

  @step("Expect the link to the full history to be visible")
  async expectFullHistoryLink() {
    await expect(this.transactionsHeader).toBeVisible();
  }

  @step("Click on last operation and return status")
  async clickLastOperationAndReturnStatus(operationType?: string): Promise<string> {
    const rows = operationType
      ? this.operationRows.filter({ has: this.operationType.filter({ hasText: operationType }) })
      : this.operationRows;
    const row = rows.first();
    const type = await row.locator(this.operationType).textContent();
    await row.click();
    return type?.includes("Failed") ? "Failed" : "Confirmed";
  }

  @step("Expect token to be present")
  async expectToken(token: AccountType) {
    await expect(this.tokenRow(token)).toBeVisible();
  }

  @step("Select token of the account")
  async selectToken(token: AccountType) {
    await this.expectToken(token);
    this.tokenInFocus = token.currency;
  }

  forgetToken() {
    this.tokenInFocus = undefined;
  }

  hasSelectedToken() {
    return this.tokenInFocus !== undefined;
  }

  @step("Rename account")
  async rename(newAccountName: string) {
    await this.settingsButton.click();
    await this.settingsEntry("change-name").click();
    await this.nameInput.fill(newAccountName);
    await this.changeNameButton.click();
  }

  @step("Delete account")
  async remove() {
    await this.settingsButton.click();
    await this.settingsEntry("remove-account").click();
    await this.removeConfirmButton.click();
  }

  @step("Expect `derivate address index to be $0` to be visible")
  async expectAddressIndex(indexNumber: number) {
    await this.settingsButton.click();
    await this.settingsEntry("advanced-logs").click();
    const advancedLogsText = await this.advancedLogsJson.innerText();
    const advancedLogsJson = advancedLogsText ? JSON.parse(advancedLogsText) : null;
    expect(advancedLogsJson).toHaveProperty("index", indexNumber);
    await this.page.keyboard.press("Escape");
  }

  // The picker only opens when the account holds several assets: no picker is the other valid outcome.
  private async clickWhenDisplayed(appearing: Locator, target: Locator) {
    try {
      await appearing.waitFor({ state: "visible", timeout: TIMEOUT.small });
    } catch (error) {
      if (error instanceof errors.TimeoutError) return;
      throw error;
    }
    await target.click();
  }
}
