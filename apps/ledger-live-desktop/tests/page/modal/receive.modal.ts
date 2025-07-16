import { Modal } from "../../component/modal.component";

export class ReceiveModal extends Modal {
  private skipDeviceButton = this.page.getByTestId("receive-connect-device-skip-device-button");

  async skipDevice() {
    await this.skipDeviceButton.click();
  }
}
