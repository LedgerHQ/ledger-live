import { expect } from "detox";

export default class WalletAPISignMessage {
  async expectSummary(accountName: string, message: string) {
    await expect(getElementByText(accountName)).toBeVisible();
    await expect(getElementByText("message")).toBeVisible();
    await expect(getElementByText(message)).toBeVisible();
  }

  summaryContinue() {
    return tapByText("Continue");
  }

  confirmNoDevice() {
    return tapByText("Confirm");
  }

  cancelNoDevice() {
    return tapByText("Cancel");
  }
}
