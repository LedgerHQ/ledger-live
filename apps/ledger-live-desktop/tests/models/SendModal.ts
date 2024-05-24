import { Locator, Page } from "@playwright/test";
import { Modal } from "./Modal";

export class SendModal extends Modal {
  readonly page: Page;

  readonly drowdownAccount: Locator;
  readonly recipientInput: Locator;
  readonly continueButton: Locator;
  readonly totalDebitValue: Locator;
  readonly checkDeviceLabel: Locator;
  readonly checkTransactionbroadcastLabel: Locator;
  readonly retryButton: Locator;
  readonly addressValue: (address: string) => Locator;
  readonly amountValue: (amount: string, currency: string) => Locator;
  readonly recipientAddressDisplayedValue: Locator;
  readonly amountDisplayedValue: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.drowdownAccount = this.page.locator('[data-test-id="modal-content"] svg').nth(1);
    this.recipientInput = this.page.getByPlaceholder("Enter");
    this.continueButton = page.getByRole("button", { name: "continue" });
    this.totalDebitValue = page.locator("text=Total to debit");
    this.checkDeviceLabel = page.locator(
      "text=Double-check the transaction details on your Ledger device before signing.",
    );
    this.checkTransactionbroadcastLabel = page.locator("text=Transaction sent");
    this.retryButton = page.getByRole("button", { name: "Retry" });
    this.addressValue = address =>
      page.locator('[data-test-id="modal-content"]').locator(`text=${address}`);
    this.amountValue = (amount, currency) => page.locator(`text=${amount} ${currency}`).first();
    this.recipientAddressDisplayedValue = page.locator("data-test-id=recipient-address");
    this.amountDisplayedValue = page.locator("data-test-id=transaction-amount");
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
