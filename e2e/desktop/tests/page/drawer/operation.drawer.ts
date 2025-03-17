import { step } from "../../misc/reporters/step";
import { Drawer } from "../../component/drawer.component";
import { expect } from "@playwright/test";

export class OperationDrawer extends Drawer {
  readonly transactionIdLabel = this.page.getByText("Transaction ID");
  readonly transactionIdValue = this.page.getByTestId("operation-id");
  readonly dateLabel = this.page.getByText("Date");
  readonly dateValue = this.page.getByTestId("operation-date");
  readonly amountLabel = this.page.getByText("Amount", { exact: true });
  readonly amountValue = this.page.getByTestId("operation-amount");
  readonly transactionType = this.page.getByTestId("transaction-type");
  readonly accountName = this.page.getByTestId("account-name");

  @step("Verify drawer information")
  async expectDrawerInfos(accountName: string) {
    await this.waitForDrawerToBeVisible();
    const transactionType = await this.transactionType.textContent();
    await expect(this.accountName).toHaveText(accountName);
    await expect(this.dateLabel).toBeVisible();
    expect(await this.dateValue.textContent()).toMatch(
      /^\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2} (AM|PM)$/,
    );
    await expect(this.transactionIdLabel).toBeVisible();
    expect(await this.transactionIdValue.textContent()).toMatch(/^[a-zA-Z0-9+/=]{40,}$/);
    if (transactionType !== "NFT Received") {
      await expect(this.amountLabel).toBeVisible();
      expect(await this.amountValue.textContent()).toMatch(/^[+-]?\$\d+\.\d{2}$/);
    } else {
      await expect(this.amountLabel).not.toBeVisible();
      expect(this.amountValue).not.toBeVisible();
    }
  }
}
