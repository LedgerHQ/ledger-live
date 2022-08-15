import { Page, Locator } from "@playwright/test";
import { Modal } from "./Modal";

export class ReceiveModal extends Modal {
  readonly page: Page;
  readonly skipDeviceButton: Locator;
  readonly verifyAddressButton: Locator;
  readonly verifyAddress: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.skipDeviceButton = page.locator("data-test-id=receive-connect-device-skip-device-button");
    this.verifyAddressButton = page.locator("data-test-id=receive-verify-address-button");
    this.verifyAddress = page.locator("data-test-id=receive-verify-address");
  }

  async skipDevice() {
    await this.skipDeviceButton.click();
  }
}
