import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

export class AccountsPage extends AppPage {
  private accountsTitle = this.page.getByRole("heading", { name: "Accounts" });
  private cryptoAddAddressButton = this.page.getByTestId("crypto-add-address-button");
  private readonly visibleAccountsList = this.page
    .locator(`[data-testid^="crypto-account-row-"]`)
    .filter({ visible: true });

  private readonly getSanitizedAccountName = (accountName: string) =>
    accountName.replaceAll(/\s+/g, "-");

  private cryptoAccountRow(accountName: string) {
    return this.page.getByTestId(`crypto-account-row-${this.getSanitizedAccountName(accountName)}`);
  }

  private readonly tokenRow = (childCurrency: Currency) =>
    this.page.getByTestId(`token-row-${childCurrency.ticker}`);

  private syncAccountButton = (accountName: string) =>
    this.cryptoAccountRow(accountName).getByTestId("sync-button").locator("div").first();

  @step("Click add account button from accounts page")
  async clickAddAccountButtonFromAccountsPage() {
    await this.cryptoAddAddressButton.click();
  }

  @step("Wait for Accounts title to be visible")
  async expectAccountsTitleVisibility() {
    await expect(this.accountsTitle).toBeVisible();
  }

  @step("Open Account $0")
  async navigateToAccountByName(accountName: string) {
    const accountRow = this.cryptoAccountRow(accountName);
    await accountRow.click();
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
    await expect(
      this.page
        .getByTestId(`crypto-account-row-${this.getSanitizedAccountName(accountName)}`)
        .filter({ visible: true }),
    ).toHaveCount(0);
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

  @step("Expect crypto account row for $0 to be visible")
  async expectCryptoAccountRowVisible(accountName: string) {
    const row = this.cryptoAccountRow(accountName);
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
      let accountName = await element.getAttribute("data-testid");
      if (accountName) {
        accountName = accountName.replaceAll("crypto-account-row-", "").replaceAll("-", " ");
        accountNames.push(accountName);
      }
    }
    return accountNames;
  }

  @step("Compare number of accounts present in app.json")
  async compareAccountsCountFromJson(count1: number, count2: number) {
    expect(count1).toBe(count2);
  }
}
