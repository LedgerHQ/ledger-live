import { Locator, Page } from "@playwright/test";
import { Modal } from "./Modal";

export class SendModal extends Modal {
  readonly page: Page;

  readonly drowdownAccount: Locator;
  readonly recipientInput: Locator;
  readonly continueButton: Locator;
  readonly verifyTotalDebit: Locator;
  readonly checkDevice: Locator;
  readonly checkTransactionbroadcast: Locator;
  readonly checkTransactionDenied: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.drowdownAccount = this.page.locator('[data-test-id="modal-content"] svg').nth(1);
    this.recipientInput = this.page.getByPlaceholder("Enter");
    this.continueButton = page.getByRole("button", { name: "continue" });
    this.verifyTotalDebit = page.locator("text=Total to debit");
    this.checkDevice = page.locator("text=Sign transaction on your Ledger Device");
    this.checkTransactionbroadcast = page.locator("text=Transaction sent");
    this.checkTransactionDenied = page.locator("text=Operation denied on device");
  }

  async selectAccount(name: string) {
    await this.drowdownAccount.click();
    await this.page.getByText(name).click();
  }

  async clickOnCameraButton() {
    await this.page.locator('[data-test-id="open-camera-qrcode-scanner"]').first().click();
  }

  async fillRecipient(recipient: string) {
    await this.recipientInput.clear();
    await this.recipientInput.fill(recipient);
  }
}
