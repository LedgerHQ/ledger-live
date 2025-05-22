import { expect } from "@playwright/test";
import { step } from "../misc/reporters/step";
import { AppPage } from "./abstractClasses";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

export class AccountsPage extends AppPage {
  private accountComponent = (accountName: string) =>
    this.page.getByTestId(`account-component-${accountName}`);
  private tokenRow = (parentName: string, childCurrency: Currency) =>
    this.accountComponent(parentName)
      .locator(`xpath=following::div`)
      .getByTestId(`token-row-${childCurrency.ticker}`);
  private tokenRowBalance = (parentName: string, childCurrency: Currency) =>
    this.tokenRow(parentName, childCurrency).getByText(`${childCurrency.ticker}`);
  private showTokensButton = (parentName: string) =>
    this.accountComponent(parentName).locator("xpath=following-sibling::button").first();
  private firstAccount = this.page.locator(".accounts-account-row-item").locator("div").first();
  // Accounts context menu
  private accountListNumber = this.page.locator(`[data-testid^="account-component-"]`);
  private syncAccountButton = (accountName: string) =>
    this.accountComponent(accountName).getByTestId("sync-button").locator("div").first();

  @step("Open Account $0")
  async navigateToAccountByName(accountName: string) {
    await this.accountComponent(accountName).click();
  }

  @step("Click sync account button for: $0")
  async clickSyncBtnForAccount(accountName: string) {
    await this.syncAccountButton(accountName).click();
  }

  @step("Click show Account $0 tokens button")
  async showParentAccountTokens(parentName: string) {
    await this.accountComponent(parentName).scrollIntoViewIfNeeded();
    await this.showTokensButton(parentName).click();
  }

  @step("Verify $0 children token accounts are not visible")
  async verifyChildrenTokensAreNotVisible(parentName: string, childCurrency: Currency) {
    await this.accountComponent(parentName).scrollIntoViewIfNeeded();
    if (await this.showTokensButton(parentName).isVisible()) {
      await this.showParentAccountTokens(parentName);
      await this.verifyTokenNotVisible(parentName, childCurrency);
    } else {
      await this.verifyTokenNotVisible(parentName, childCurrency);
    }
  }

  @step("Verify token visibility having parent $0")
  async verifyTokenVisibility(parentName: string, childCurrency: Currency) {
    await expect(this.tokenRow(parentName, childCurrency)).toBeVisible();
  }

  @step("Verify token is not visible in parent account $0")
  async verifyTokenNotVisible(parentName: string, childCurrency: Currency) {
    await expect(this.tokenRow(parentName, childCurrency)).not.toBeVisible();
  }

  @step("Expect token balance to be null")
  async expectTokenBalanceToBeNull(parentName: string, childCurrency: Currency) {
    await expect(this.tokenRowBalance(parentName, childCurrency)).toHaveText(
      `0 ${childCurrency.ticker}`,
    );
  }

  @step("Check $0 account was deleted ")
  async expectAccountAbsence(accountName: string) {
    expect(this.firstAccount).not.toBe(accountName);
    expect(await this.getAccountsName()).not.toContain(accountName);
  }

  @step("Get number of accounts in the list")
  async countAccounts(): Promise<number> {
    return await this.page.locator(".accounts-account-row-item-content").count();
  }

  @step("Expect number of accounts to be $0")
  async expectAccountsCount(count: number) {
    expect(await this.countAccounts()).toBe(count);
  }

  async getAccountsName() {
    const accountElements = await this.accountListNumber.all();
    const accountNames = [];
    for (const element of accountElements) {
      let accountName = await element.getAttribute("data-testid");
      if (accountName) {
        accountName = accountName.replace("account-component-", "");
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
