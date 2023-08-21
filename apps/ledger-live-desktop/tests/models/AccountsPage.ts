import { Page, Locator } from "@playwright/test";

export class AccountsPage {
  readonly page: Page;
  readonly addAccountButton: Locator;
  readonly firstAccount: Locator;
  readonly accountComponent: (accountName: string) => Locator;
  readonly contextMenuSend: Locator;
  readonly contextMenuReceive: Locator;
  readonly contextMenuSwap: Locator;
  readonly contextMenuStake: Locator;
  readonly contextMenuBuy: Locator;
  readonly contextMenuSell: Locator;
  readonly contextMenuEdit: Locator;
  readonly contextMenuHideToken: Locator;
  readonly contextMenuHideStar: Locator;
  readonly settingsDeleteButton: Locator;
  readonly settingsConfirmButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addAccountButton = page.locator("data-test-id=accounts-add-account-button");
    this.accountComponent = (accountName: string) =>
      page.locator(`data-test-id=account-component-${accountName}`);
    this.firstAccount = page.locator(".accounts-account-row-item").locator("div").first();

    // Accounts context menu
    this.contextMenuSend = page.locator("data-test-id=accounts-context-menu-send");
    this.contextMenuReceive = page.locator("data-test-id=accounts-context-menu-receive");
    this.contextMenuSwap = page.locator("data-test-id=accounts-context-menu-swap");
    this.contextMenuStake = page.locator("data-test-id=accounts-context-menu-stake");
    this.contextMenuBuy = page.locator("data-test-id=accounts-context-menu-buy");
    this.contextMenuSell = page.locator("data-test-id=accounts-context-menu-sell");
    this.contextMenuEdit = page.locator("data-test-id=accounts-context-menu-edit");
    this.contextMenuHideToken = page.locator("data-test-id=accounts-context-menu-hideToken");
    this.contextMenuHideStar = page.locator("data-test-id=accounts-context-menu-star");

    this.settingsDeleteButton = page.locator("data-test-id=account-settings-delete-button");
    this.settingsConfirmButton = page.locator("data-test-id=modal-confirm-button");
  }

  async openAddAccountModal() {
    await this.addAccountButton.click();
  }

  async navigateToAccountByName(accountName: string) {
    await this.accountComponent(accountName).click();
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
}
