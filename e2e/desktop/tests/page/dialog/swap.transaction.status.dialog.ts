import { Dialog } from "tests/component/dialog.component";
import { expect } from "@playwright/test";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { step } from "tests/misc/reporters/step";

export class SwapTransactionStatusDialog extends Dialog {
  readonly dialog = this.page.getByTestId("swap-transaction-status-dialog");
  readonly title = this.page.getByTestId("swap-transaction-title");
  readonly date = this.page.getByTestId("swap-transaction-date");
  readonly sendRow = this.page.getByTestId("swap-transaction-status-send-row");
  readonly receiveRow = this.page.getByTestId("swap-transaction-status-receive-row");
  readonly sentAmount = this.page.getByTestId("swap-transaction-status-send-amount");
  readonly receivedAmount = this.page.getByTestId("swap-transaction-status-receive-amount");
  readonly provider = this.page.getByTestId("swap-transaction-details-provider");
  readonly swapId = this.page.getByTestId("swap-transaction-details-swap-id");
  readonly networkFees = this.page.getByTestId("swap-transaction-details-network-fees");
  readonly receiveAccount = this.page.getByTestId("swap-transaction-details-receive-account");
  readonly viewExplorerBtn = this.page.getByTestId("swap-transaction-view-explorer-btn");

  @step("Verify swap transaction status dialog information")
  async expectSwapTransactionStatusDialogInfos(
    swapIdPrefix: string,
    provider: SwapProvider,
    details: {
      date: string;
      sentAmount: string;
      receivedAmount: string;
      networkFees: string;
      receiveAccount: string;
      providerUrl?: string;
    },
  ) {
    await expect(this.dialog).toBeVisible();
    await expect(this.sendRow).toBeVisible();
    await expect(this.sentAmount).toBeVisible();
    await expect(this.sentAmount).toHaveText(details.sentAmount);
    await expect(this.receiveRow).toBeVisible();
    await expect(this.receivedAmount).toBeVisible();
    await expect(this.receivedAmount).toHaveText(details.receivedAmount);
    await expect(this.networkFees).toBeVisible();
    await expect(this.networkFees).toHaveText(details.networkFees);
    await expect(this.receiveAccount).toBeVisible();
    await expect(this.receiveAccount).toHaveText(details.receiveAccount);
    await expect(this.swapId).toContainText(swapIdPrefix);
    await expect(this.provider).toHaveText(provider.uiName);
    await this.softExpect(async soft => {
      await soft(this.title).toBeVisible();
      await soft(this.title).toHaveText(/Swap/);
      await soft(this.date).toBeVisible();
      await soft(this.date).toContainText(details.date);
      if (details.providerUrl) {
        await soft(this.provider).toHaveAttribute("data-href", details.providerUrl);
      } else {
        await soft(this.provider).not.toHaveAttribute("data-href");
      }
      await soft(this.viewExplorerBtn).toBeVisible();
      await soft(this.viewExplorerBtn).toHaveAttribute("data-href", /^https:\/\/.+/);
    });
  }
}
