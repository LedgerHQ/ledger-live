import { Page, Locator } from "@playwright/test";
import { Modal } from "./Modal";

export class SendModal extends Modal {
  readonly page: Page;
  readonly recipientField: Locator;
  readonly btnContinue: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.recipientField = page.locator("id=send-recipient-input");
    this.btnContinue = page.locator("id=send-recipient-continue-button");
  }

  async fillRecipient(address: string) {
    await this.recipientField.fill(address);
  }

  async clickBtnContinue() {
    await this.btnContinue.click();
  }
}
