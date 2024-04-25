import { Page, Locator } from "@playwright/test";
import { Modal } from "./Modal";

export class ReceiveModal extends Modal {
  readonly page: Page;
  readonly skipDeviceButton: Locator;
  readonly verifyMyAddressButton: Locator;
  readonly verifyAddress: Locator;
  readonly approve: Locator;
  readonly receiveAddress: (address: string) => Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.skipDeviceButton = page.locator("data-test-id=receive-connect-device-skip-device-button");
    this.verifyMyAddressButton = page.locator("data-test-id=receive-verify-address-button");
    this.verifyAddress = page.locator(
      "text=Verify that the shared address exactly matches the one on your device",
    );
    this.approve = page.locator("text=Address shared securely");
    this.receiveAddress = address => page.locator(`text=${address}`);
  }

  async skipDevice() {
    await this.skipDeviceButton.click();
  }
}
