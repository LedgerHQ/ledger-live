import { step } from "../../misc/reporters/step";
import { Drawer } from "../../component/drawer.component";
import { expect } from "@playwright/test";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { getAccountAddress } from "@ledgerhq/live-common/e2e/enum/Account";

export class SendDrawer extends Drawer {
  private sendDrawer = this.page.getByTestId("drawer-content");
  private addressValue = (address: string) => this.sendDrawer.filter({ hasText: address });
  private amountValue = this.page.getByTestId("amountReceived-drawer").first();

  @step("Verify address is visible")
  async addressValueIsVisible(address: string) {
    await expect(this.addressValue(address)).toBeVisible();
  }

  @step("Verify that the information of the transaction is visible")
  async expectReceiverInfos(tx: Transaction) {
    await expect(this.addressValue(getAccountAddress(tx.accountToCredit))).toBeVisible();
    await expect(this.amountValue).toBeVisible();
    const displayedAmount = await this.amountValue.innerText();
    expect(displayedAmount).toEqual(expect.stringContaining(tx.amount));
    expect(displayedAmount).toEqual(expect.stringContaining(tx.accountToDebit.currency.ticker));
  }
}
