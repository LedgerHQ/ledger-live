import { Modal } from "../../component/modal.component";

export class ReceiveModal extends Modal {
  private skipDeviceButton = this.page.getByTestId("receive-connect-device-skip-device-button");
  private errorMessage = this.page.locator('div[type="error"]');

  async skipDevice() {
    await this.skipDeviceButton.click();
  }

  async getErrorMessageText() {
    return await this.errorMessage.textContent();
  }
}
