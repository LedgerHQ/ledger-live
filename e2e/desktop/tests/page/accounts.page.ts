import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

export class AccountsPage extends AppPage {
  private accountsTitle = this.page.getByRole("heading", { name: "Accounts" });
  private readonly visibleAccountsList = this.page
    .locator(`[data-testid^="crypto-account-row-"]`)
    .filter({ visible: true });

  private readonly getSanitizedAccountName = (accountName: string) =>
    accountName.replaceAll(/\s+/g, "-");
  private readonly tokenRow = (childCurrency: Currency) =>
    this.page.getByTestId(`token-row-${childCurrency.ticker}`);

  private syncAccountButton = (accountName: string) =>
    this.page
      .getByTestId(`crypto-account-row-${this.getSanitizedAccountName(accountName)}`)
      .getByTestId("sync-button")
      .locator("div")
      .first();

  @step("Wait for Accounts title to be visible")
  async expectAccountsTitleVisibility() {
    await expect(this.accountsTitle).toBeVisible();
  }

  @step("Open Account $0")
  async navigateToAccountByName(accountName: string) {
    const accountRow = this.page.getByTestId(
      `crypto-account-row-${this.getSanitizedAccountName(accountName)}`,
    );
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
  async expectAccountsCount(count: number) {
    await expect(this.visibleAccountsList).toHaveCount(count, { timeout: 30000 });
  }

  @step("Expect at least one visible account in the list")
  async expectAtLeastOneAccountVisible() {
    expect(await this.countAccounts()).toBeGreaterThan(0);
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
