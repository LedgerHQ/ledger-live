import { Locator, Page } from "@playwright/test";
import { Modal } from "./Modal";

export class SendModal extends Modal {
  readonly page: Page;

  readonly drowdownAccount: Locator;
  readonly recipientInput: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.drowdownAccount = this.page.locator('[data-test-id="modal-content"] svg').nth(1);
    this.recipientInput = this.page.getByPlaceholder('[data-test-id="send-recipient-input"]');
  }

  async selectAccount(name: string) {
    await this.drowdownAccount.click();
    await this.page.getByText(name).click();
  }

  async fillRecipient(recipient: string) {
    await this.recipientInput.clear();
    await this.recipientInput.fill(recipient);
  }
}
