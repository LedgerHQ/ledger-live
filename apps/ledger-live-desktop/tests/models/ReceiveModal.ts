import { Page, Locator } from "@playwright/test";
import { Modal } from "./Modal";

export class ReceiveModal extends Modal {
  readonly page: Page;
  readonly skipDeviceButton: Locator;
  readonly verifyMyAddressButton: Locator;
  readonly verifyAddressOnDevice: Locator;
  readonly approve: Locator;
  readonly receiveAddress: (address: string) => Locator;
  readonly addressDisplayed: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.skipDeviceButton = page.locator("data-test-id=receive-connect-device-skip-device-button");
    this.verifyMyAddressButton = page.locator("data-test-id=receive-verify-address-button");
    this.verifyAddressOnDevice = page.locator(
      "text=Verify that the shared address exactly matches the one on your device",
    );
    this.approve = page.locator("text=Address shared securely");
    this.receiveAddress = address => page.locator(`text=${address}`);
    this.addressDisplayed = page.locator("data-test-id=address-field");
  }

  async skipDevice() {
    await this.skipDeviceButton.click();
  }
}
