import { Modal } from "../../component/modal.component";
import { step } from "tests/misc/reporters/step";

export class SendModal extends Modal {
  private drowdownAccount = this.page.locator("#account-debit-placeholder");
  readonly recipientInput = this.page.getByTestId("send-recipient-input");
  readonly inputError = this.page.locator("id=input-error");
  readonly senderError = this.page.getByTestId("sender-error");
  readonly continueButton = this.page.getByRole("button", { name: "continue" });
  readonly closeButton = this.page.locator('[data-testid="modal-close-button"]');

  async selectAccount(name: string) {
    await this.drowdownAccount.click();
    await this.page.getByText(name).click();
  }

  async clickOnCameraButton() {
    await this.page.getByTestId("open-camera-qrcode-scanner").first().click();
  }

  @step("Enter recipient as $0")
  async fillRecipient(recipient: string) {
    await this.recipientInput.clear();
    await this.recipientInput.fill(recipient);
  }

  @step("Close modal")
  async closeModal() {
    await this.closeButton.click();
  }

  async getSenderError() {
    return this.senderError;
  }

  async getErrorMessage() {
    await this.inputError.waitFor({ state: "visible" });
    return await this.inputError.textContent();
  }

  async getSenderErrorMessage() {
    await this.senderError.waitFor({ state: "visible" });
    return await this.senderError.textContent();
  }

  async getContinueButton() {
    return await this.continueButton;
  }
}
