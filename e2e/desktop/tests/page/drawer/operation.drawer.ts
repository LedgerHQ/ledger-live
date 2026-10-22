import { step } from "tests/misc/reporters/step";
import { Drawer } from "tests/component/drawer.component";
import { expect } from "@playwright/test";
import type { ClickedHistoryOperationSnapshot } from "tests/page/history.page";

export class OperationDrawer extends Drawer {
  readonly transactionIdLabel = this.page.getByTestId("operation-id-label");
  readonly transactionIdValue = this.page.getByTestId("operation-id");
  readonly dateLabel = this.page.getByTestId("operation-date-label");
  readonly dateValue = this.page.getByTestId("operation-date");
  readonly amountLabel = this.page.getByTestId("operation-amount-label");
  readonly amountValue = this.page.getByTestId("operation-amount");
  readonly transactionType = this.page.getByTestId("transaction-type");
  readonly accountName = this.page.getByTestId("account-name");

  @step("Verify history operation details match clicked row")
  async expectOperationDetailsVisible(snapshot: ClickedHistoryOperationSnapshot) {
    await this.waitForDrawerToBeVisible();

    await expect(this.transactionType).toHaveText(snapshot.typeLabel);

    await expect(this.amountValue).toHaveText(snapshot.fiatAmountText);

    await this.softExpect(async soft => {
      await soft(this.transactionIdLabel).toBeVisible();
      await soft(this.transactionIdValue).toHaveText(/\S{16,}/);
      await soft(this.dateLabel).toBeVisible();
      await soft(this.dateValue).toBeVisible();
      await soft(this.dateValue).toHaveText(/^\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2} (AM|PM)$/);
    });
  }

  @step("Verify drawer information")
  async expectDrawerInfos(accountName: string, status: string) {
    await this.waitForDrawerToBeVisible();
    const transactionType = await this.transactionType.textContent();
    await expect(this.accountName).toHaveText(accountName);
    await this.softExpect(async soft => {
      await soft(this.dateLabel).toBeVisible();
      await soft(this.dateValue).toHaveText(/^\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2} (AM|PM)$/);
      await soft(this.transactionIdLabel).toBeVisible();
      await soft(this.transactionIdValue).toHaveText(/^[a-zA-Z0-9+/=]{40,}$/);
    });
    if (transactionType !== "NFT Received" && status !== "Failed") {
      await expect(this.amountLabel).toBeVisible();
      expect(await this.amountValue.textContent()).toMatch(/^[+-]?\$\d+\.\d{2}$/);
    } else {
      await expect(this.amountValue).not.toBeVisible();
    }
  }
}
