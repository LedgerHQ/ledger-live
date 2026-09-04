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

  @step("Verify amount is visible in transaction details: $0")
  async expectAmountVisible(amount: string) {
    // Digit-boundary guarded rather than a plain substring: "0.1234567890" contains
    // "0.123456789", so a substring match would accept a differently-rounded amount and
    // defeat the point of a precision assertion.
    const escaped = amount.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    await expect(
      this.sendDrawer.filter({ hasText: new RegExp(String.raw`(?<!\d)${escaped}(?!\d)`) }),
    ).toBeVisible();
  }
}
