import { Page, Locator } from "@playwright/test";

export class AccountPage {
  readonly page: Page;
  readonly buttonsGroup: Locator;
  readonly settingsButton: Locator;
  readonly buttonSend: Locator;
  readonly accountRow: Function;

  constructor(page: Page) {
    this.page = page;
    this.buttonsGroup = page.locator("data-test-id=account-buttons-group");
    this.settingsButton = page.locator("data-test-id=account-settings-button");
    this.buttonSend = page.locator("data-test-id=account-send-button");
    this.accountRow = (name: string): Locator => page.locator(`text=${name}`);
  }

  async clickBtnSend() {
    await this.buttonSend.click();
  }

  async goToTokenAccount(name: string) {
    await this.accountRow(name).click();
  }
}
