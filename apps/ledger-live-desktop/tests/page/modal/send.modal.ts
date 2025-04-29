import { Modal } from "../../component/modal.component";
import { step } from "tests/misc/reporters/step";

export class SendModal extends Modal {
  private drowdownAccount = this.page.locator('[data-testid="modal-content"] svg').nth(1);
  readonly recipientInput = this.page.getByTestId("send-recipient-input");

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
}
