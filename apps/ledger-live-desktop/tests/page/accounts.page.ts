import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

export class AccountsPage extends AppPage {
  private addAccountButton = this.page.getByTestId("accounts-add-account-button");
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
  private contextMenuEdit = this.page.getByTestId("accounts-context-menu-edit");
  private settingsDeleteButton = this.page.getByTestId("account-settings-delete-button");
  private settingsConfirmButton = this.page.getByTestId("modal-confirm-button");
  private accountListNumber = this.page.locator(`[data-testid^="account-component-"]`);
  private syncAccountButton = (accountName: string) =>
    this.accountComponent(accountName).getByTestId("sync-button").locator("div").first();

  async openAddAccountModal() {
    await this.addAccountButton.click();
  }

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
  async verifyChildrenTokensAreNotVisible(parentName: string) {
    await this.accountComponent(parentName).scrollIntoViewIfNeeded();
    await expect(this.showTokensButton(parentName)).not.toBeVisible();
  }

  @step("Verify token visibility having parent $0")
  async verifyTokenVisibility(parentName: string, childCurrency: Currency) {
    await expect(this.tokenRow(parentName, childCurrency)).toBeVisible();
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

  /**
   * Delete first account from accounts list
   */
  async deleteFirstAccount() {
    await this.firstAccount.click({ button: "right" });
    await this.contextMenuEdit.click();
    await this.settingsDeleteButton.click();
    await this.settingsConfirmButton.click();
  }

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
