import { expect } from "@playwright/test";
import { Modal } from "../../component/modal.component";
import { step } from "tests/misc/reporters/step";

export class ReceiveModal extends Modal {
  private skipDeviceButton = this.page.locator(
    "data-test-id=receive-connect-device-skip-device-button",
  );
  private verifyAddressOnDeviceLabel = this.page.locator(
    "text=Verify that the shared address exactly matches the one on your device",
  );
  private approveLabel = this.page.locator("text=Address shared securely");
  private receiveAddressValue = (address: string) => this.page.locator(`text=${address}`);
  private addressDisplayedValue = this.page.locator("#address-field");

  async skipDevice() {
    await this.skipDeviceButton.click();
  }

  @step("Verify receive address correctness $0")
  async expectValidReceiveAddress(address: string) {
    await expect(this.verifyAddressOnDeviceLabel).toBeVisible();
    await expect(this.receiveAddressValue(address)).toBeVisible();
    expect(await this.addressDisplayedValue.innerText()).toEqual(address);
  }

  @step("Verify approve label visibility")
  async expectApproveLabel() {
    await expect(this.approveLabel).toBeVisible();
  }
}
