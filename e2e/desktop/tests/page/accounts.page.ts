import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";

const CRYPTO_ACCOUNT_ROW_PREFIX = "crypto-account-row-";

export class AccountsPage extends AppPage {
  private accountsTitle = this.page.getByRole("heading", { name: "Accounts" });
  private addAccountButton = this.page.getByTestId("crypto-add-address-button");

  private getVisibleAccountsList() {
    return this.page.locator(`[data-testid^="${CRYPTO_ACCOUNT_ROW_PREFIX}"]`).filter({
      visible: true,
    });
  }

  private readonly getSanitizedAccountName = (accountName: string) =>
    accountName.replaceAll(/\s+/g, "-");

  private getAccountRow(accountName: string) {
    return this.page.getByTestId(
      `${CRYPTO_ACCOUNT_ROW_PREFIX}${this.getSanitizedAccountName(accountName)}`,
    );
  }

  private readonly tokenRow = (childCurrency: Currency) =>
    this.page.getByTestId(`token-row-${childCurrency.ticker}`);

  private syncAccountButton = (accountName: string) =>
    this.getAccountRow(accountName).getByTestId("sync-button").locator("div").first();

  @step("Click add account button from accounts page")
  async clickAddAccountButtonFromAccountsPage() {
    await this.addAccountButton.click();
  }

  @step("Wait for Accounts title to be visible")
  async expectAccountsTitleVisibility() {
    await expect(this.accountsTitle).toBeVisible();
  }

  @step("Open Account $0")
  async navigateToAccountByName(accountName: string) {
    const row = await this.getAccountRow(accountName);
    await row.click();
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
  private async verifyTokenNotVisible(childCurrency: Currency) {
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
    const row = await this.getAccountRow(accountName);
    await expect(row.filter({ visible: true })).toHaveCount(0);
    const names = await this.getAccountsName();
    expect(names).not.toContain(accountName);
  }

  @step("Get number of accounts in the list")
  async countAccounts(): Promise<number> {
    const visibleAccountsList = await this.getVisibleAccountsList();
    return visibleAccountsList.count();
  }

  @step("Expect number of accounts to be $0")
  async expectAccountsCount(count: number, timeout = TIMEOUT.xlarge) {
    const visibleAccountsList = await this.getVisibleAccountsList();
    await expect(visibleAccountsList).toHaveCount(count, { timeout });
  }

  async getReduxAccountIds(): Promise<string[]> {
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
      .poll(async () => (await this.getReduxAccountIds()).length, {
        timeout: TIMEOUT.xxlarge,
      })
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
        { timeout: TIMEOUT.xxlarge },
      )
      .toBe(true);
  }

  @step("Expect account row for $0 to be visible")
  async expectCryptoAccountRowVisible(accountName: string) {
    const row = await this.getAccountRow(accountName);
    await row.waitFor({ state: "attached", timeout: TIMEOUT.xxxlarge });
    await row.scrollIntoViewIfNeeded();
    await expect(row).toBeVisible({ timeout: TIMEOUT.xxlarge });
  }

  @step("Expect at least one visible account in the list")
  async expectAtLeastOneAccountVisible() {
    const visibleAccountsList = await this.getVisibleAccountsList();
    await expect(visibleAccountsList).not.toHaveCount(0);
  }

  private async getAccountsName() {
    const visibleAccountsList = this.getVisibleAccountsList();
    const accountElements = await visibleAccountsList.all();
    const accountNames = [];
    for (const element of accountElements) {
      const testId = await element.getAttribute("data-testid");
      if (testId) {
        const rawName = testId.replace(CRYPTO_ACCOUNT_ROW_PREFIX, "");
        accountNames.push(rawName.replaceAll("-", " "));
      }
    }
    return accountNames;
  }

  @step("Compare number of accounts present in app.json")
  async compareAccountsCountFromJson(count1: number, count2: number) {
    expect(count1).toBe(count2);
  }
}
