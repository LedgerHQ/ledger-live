import { step } from "tests/misc/reporters/step";
import { Drawer } from "tests/component/drawer.component";
import { expect } from "@playwright/test";
import { Transaction } from "tests/models/Transaction";

export class SendDrawer extends Drawer {
  private addressValue = (address: string) =>
    this.page.locator('[data-testid="drawer-content"]').locator(`text=${address}`);
  private amountValue = this.page.getByTestId("amountReceived-drawer");

  @step("Verify address is visible")
  async addressValueIsVisible(address: string) {
    await expect(this.addressValue(address)).toBeVisible();
  }

  @step("Verify that the information of the transaction is visible")
  async expectReceiverInfos(tx: Transaction) {
    await expect(this.addressValue(tx.accountToCredit.address)).toBeVisible();
    await expect(this.amountValue).toBeVisible();
  }
}
