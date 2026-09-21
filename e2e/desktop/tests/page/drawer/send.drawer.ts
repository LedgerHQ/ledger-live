import { step } from "tests/misc/reporters/step";
import { Drawer } from "tests/component/drawer.component";
import { expect } from "@playwright/test";
import { exactAmountPattern } from "@ledgerhq/live-e2e-shared/amountPattern";

export class SendDrawer extends Drawer {
  private sendDrawer = this.page.getByTestId("drawer-content");
  private amountValue = this.sendDrawer.getByTestId("amountReceived-drawer").first();
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
    // Scoped to the amount element rather than the whole drawer: the fee and total rows also
    // render crypto values, and either would satisfy a drawer-wide match.
    await expect(this.amountValue).toHaveText(exactAmountPattern(amount));
  }
}
