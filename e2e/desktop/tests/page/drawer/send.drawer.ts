import { step } from "tests/misc/reporters/step";
import { Drawer } from "tests/component/drawer.component";
import { expect } from "@playwright/test";

export class SendDrawer extends Drawer {
  private sendDrawer = this.page.getByTestId("drawer-content");
  private addressValue = (address: string) => this.sendDrawer.filter({ hasText: address });

  @step("Verify address is visible")
  async addressValueIsVisible(address: string | undefined) {
    if (!address) {
      throw new Error("Recipient address is not set");
    }
    await expect(this.addressValue(address)).toBeVisible();
  }

  @step("Verify memo is visible in transaction details: $0")
  async expectMemoVisible(memo: string) {
    await expect(this.sendDrawer.getByText(memo, { exact: true })).toBeVisible();
  }
}
