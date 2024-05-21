import { Page, Locator } from "@playwright/test";
import { Modal } from "./Modal";

export class ReceiveModal extends Modal {
  readonly page: Page;
  readonly skipDeviceButton: Locator;
  readonly verifyMyAddressButton: Locator;
  readonly verifyAddressOnDeviceLabel: Locator;
  readonly approveLabel: Locator;
  readonly receiveAddressValue: (address: string) => Locator;
  readonly addressDisplayedValue: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.skipDeviceButton = page.locator("data-test-id=receive-connect-device-skip-device-button");
    this.verifyMyAddressButton = page.locator("data-test-id=receive-verify-address-button");
    this.verifyAddressOnDeviceLabel = page.locator(
      "text=Verify that the shared address exactly matches the one on your device",
    );
    this.approveLabel = page.locator("text=Address shared securely");
    this.receiveAddressValue = address => page.locator(`text=${address}`);
    this.addressDisplayedValue = page.locator("#address-field");
  }

  async skipDevice() {
    await this.skipDeviceButton.click();
  }
}
