import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { isAssetSectionEnabled } from "tests/utils/featureFlagUtils";

export class AccountsPage extends AppPage {
  private accountsTitle = this.page.getByRole("heading", { name: "Accounts" });
  // Accounts-page add-account button differs per Asset Section variant:
  //   ON  → Cryptos page header button (`crypto-add-address-button`)
  //   OFF → legacy Accounts page header button (`accounts-add-account-button`)
  private cryptoAddAddressButton = this.page.getByTestId("crypto-add-address-button");
  private accountsAddAccountButton = this.page.getByTestId("accounts-add-account-button");
  // Account-list row test ids differ per Asset Section variant:
  //   ON  → CryptoAddresses rows: `crypto-account-row-<sanitized name>`
  //   OFF → legacy Accounts rows: `account-component-<raw name>`
  private readonly accountRowTestIdPrefix = isAssetSectionEnabled
    ? "crypto-account-row-"
    : "account-component-";
  private readonly visibleAccountsList = this.page
    .locator(`[data-testid^="${this.accountRowTestIdPrefix}"]`)
    .filter({ visible: true });

  private readonly getSanitizedAccountName = (accountName: string) =>
    accountName.replaceAll(/\s+/g, "-");

  private cryptoAccountRow(accountName: string) {
    return this.page.getByTestId(`crypto-account-row-${this.getSanitizedAccountName(accountName)}`);
  }

  // Legacy accounts page (Asset Section OFF) row, identified by the raw (unsanitized) account name.
  private legacyAccountRow(accountName: string) {
    return this.page.getByTestId(`account-component-${accountName}`);
  }

  // Account-list row matching the active Asset Section variant (crypto vs legacy).
  private accountRow(accountName: string) {
    return isAssetSectionEnabled
      ? this.cryptoAccountRow(accountName)
      : this.legacyAccountRow(accountName);
  }

  private readonly tokenRow = (childCurrency: Currency) =>
    this.page.getByTestId(`token-row-${childCurrency.ticker}`);

  private syncAccountButton = (accountName: string) =>
    this.cryptoAccountRow(accountName).getByTestId("sync-button").locator("div").first();

  @step("Click add account button from accounts page")
  async clickAddAccountButtonFromAccountsPage() {
    const addAccountButton = isAssetSectionEnabled
      ? this.cryptoAddAddressButton
      : this.accountsAddAccountButton;
    await addAccountButton.click();
  }

  @step("Wait for Accounts title to be visible")
  async expectAccountsTitleVisibility() {
    await expect(this.accountsTitle).toBeVisible();
  }

  @step("Open Account $0")
  async navigateToAccountByName(accountName: string) {
    await this.accountRow(accountName).click();
  }

  @step("Click sync account button for: $0")
  async clickSyncBtnForAccount(accountName: string) {
    await this.syncAccountButton(accountName).click();
  }

  @step("Click show Account $0 tokens button")
  async showParentAccountTokens(parentName: string) {
    await this.navigateToAccountByName(parentName);
  }

  @step("Verify $0 children token accounts are not visible")
  async verifyChildrenTokensAreNotVisible(parentName: string, childCurrency: Currency) {
    await this.navigateToAccountByName(parentName);
    await this.verifyTokenNotVisible(childCurrency);
  }

  @step("Verify token visibility")
  async verifyTokenVisibility(childCurrency: Currency) {
    await expect(this.tokenRow(childCurrency)).toBeVisible();
  }

  @step("Verify token is not visible in parent account")
  async verifyTokenNotVisible(childCurrency: Currency) {
    await expect(this.tokenRow(childCurrency)).not.toBeVisible();
  }

  @step("Expect token balance to be null")
  async expectTokenBalanceToBeNull(childCurrency: Currency) {
    await expect(
      this.page
        .getByTestId(`token-row-${childCurrency.ticker}`)
        .getByText(`0 ${childCurrency.ticker}`),
    ).toBeVisible();
  }

  @step("Check $0 account was deleted ")
  async expectAccountAbsence(accountName: string) {
    await expect(this.accountRow(accountName).filter({ visible: true })).toHaveCount(0);
    expect(await this.getAccountsName()).not.toContain(accountName);
  }

  @step("Get number of accounts in the list")
  async countAccounts(): Promise<number> {
    return await this.visibleAccountsList.count();
  }

  @step("Expect number of accounts to be $0")
  async expectAccountsCount(count: number, timeout = 30_000) {
    await expect(this.visibleAccountsList).toHaveCount(count, { timeout });
  }

  private async getReduxAccountIds(): Promise<string[]> {
    return this.page.evaluate(() => {
      const store = globalThis.window.__STORE__;
      if (!store?.getState) return [];
      const state: { accounts?: { id?: string }[] } = store.getState();

      if (state.accounts) {
        return state.accounts
          .map(account => account.id)
          .filter((accountId): accountId is string => Boolean(accountId));
      }

      return [];
    });
  }

  /**
   * Waits until the in-app Redux store has the expected number of accounts.
   * Use after Ledger Sync / bridge merges (CI can show the success screen before all rows exist).
   */
  @step("Expect Redux accounts length to be $0")
  async expectReduxAccountsLength(count: number) {
    await expect
      .poll(async () => (await this.getReduxAccountIds()).length, { timeout: 60_000 })
      .toBe(count);
  }

  @step("Expect Redux account ids to be $0")
  async expectReduxAccountIds(expectedAccountIds: string[]) {
    await expect
      .poll(
        async () => {
          const accountIds = await this.getReduxAccountIds();
          return (
            accountIds.length === expectedAccountIds.length &&
            expectedAccountIds.every(accountId => accountIds.includes(accountId))
          );
        },
        { timeout: 60_000 },
      )
      .toBe(true);
  }

  @step("Expect account row for $0 to be visible")
  async expectCryptoAccountRowVisible(accountName: string) {
    const row = this.accountRow(accountName);
    await row.waitFor({ state: "attached", timeout: 120_000 });
    await row.scrollIntoViewIfNeeded();
    await expect(row).toBeVisible({ timeout: 60_000 });
  }

  @step("Expect at least one visible account in the list")
  async expectAtLeastOneAccountVisible() {
    await expect(this.visibleAccountsList).not.toHaveCount(0);
  }

  async getAccountsName() {
    const accountElements = await this.visibleAccountsList.all();
    const accountNames = [];
    for (const element of accountElements) {
      const testId = await element.getAttribute("data-testid");
      if (testId) {
        const rawName = testId.replace(this.accountRowTestIdPrefix, "");
        // ON sanitizes spaces to dashes in the test id; OFF keeps the raw account name.
        accountNames.push(isAssetSectionEnabled ? rawName.replaceAll("-", " ") : rawName);
      }
    }
    return accountNames;
  }

  @step("Compare number of accounts present in app.json")
  async compareAccountsCountFromJson(count1: number, count2: number) {
    expect(count1).toBe(count2);
  }
}
