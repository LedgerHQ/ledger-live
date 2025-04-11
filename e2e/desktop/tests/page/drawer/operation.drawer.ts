import { step } from "../../misc/reporters/step";
import { Drawer } from "../../component/drawer.component";
import { expect } from "@playwright/test";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Swap";

export class OperationDrawer extends Drawer {
  readonly transactionIdLabel = this.page.getByText("Transaction ID");
  readonly transactionIdValue = this.page.getByTestId("operation-id");
  readonly dateLabel = this.page.getByText("Date");
  readonly dateValue = this.page.getByTestId("operation-date");
  readonly amountLabel = this.page.getByText("Amount", { exact: true });
  readonly amountValue = this.page.getByTestId("operation-amount");
  readonly transactionType = this.page.getByTestId("transaction-type");
  readonly accountName = this.page.getByTestId("account-name");

  readonly swapDrawerTitle = this.page.getByTestId("swap-drawer-operation-type");
  readonly swapIdLabel = this.page.getByText("Swap ID");
  readonly swapIdValue = this.page.getByTestId("swap-drawer-swapId");
  readonly swapStatus = this.page.getByTestId("swap-drawer-status");
  readonly swapProviderLink = this.page.getByTestId("swap-drawer-provider-link");
  readonly swapFromAccount = this.page.getByTestId("swap-drawer-account-from");
  readonly swapToAccount = this.page.getByTestId("swap-drawer-account-to");
  readonly swapAmountSent = this.page.getByTestId("swap-drawer-amount-from");
  readonly swapAmountReceived = this.page.getByTestId("swap-drawer-amount-to");
  readonly swapOperationDetailsLink = this.page.getByTestId("swap-drawer-operation-details-link");

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
      await expect(this.amountValue).not.toBeVisible();
    }
  }

  @step("Verify swap drawer information")
  async expectSwapDrawerInfos(swapId: string, swap: Swap, provider: Provider) {
    await this.waitForDrawerToBeVisible();
    expect(await this.swapDrawerTitle.textContent()).toMatch("Swap");
    await expect(this.swapIdLabel).toBeVisible();
    expect(await this.swapIdValue.textContent()).toMatch(swapId);
    await expect(this.swapStatus).toBeVisible();
    expect(await this.swapStatus.textContent()).toMatch(/pending|finished/);
    expect(await this.dateValue.textContent()).toMatch(
      /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/\d{4}$/,
    );
    expect(await this.swapFromAccount.textContent()).toMatch(swap.accountToDebit.accountName);
    expect(await this.swapAmountSent.textContent()).toContain(swap.amount);
    expect(await this.swapToAccount.textContent()).toMatch(swap.accountToCredit.accountName);
    await expect(this.swapAmountReceived).toBeVisible();

    expect(await this.swapProviderLink.textContent()).toContain(provider.uiName);
    await expect(this.swapOperationDetailsLink).toBeVisible();
  }
}
