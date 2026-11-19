import { expect } from "@playwright/test";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Dialog } from "tests/component/dialog.component";
import { step } from "tests/misc/reporters/step";

export class PerpsTransactionSignedDialog extends Dialog {
  private readonly signedCta = this.page.getByTestId("perps-transaction-signed-cta");
  private readonly signedDialog = this.page.getByRole("dialog").filter({ has: this.signedCta });
  private readonly signedTitle = this.signedDialog.getByText("Transaction signed", {
    exact: true,
  });
  private readonly signedDescription = this.signedDialog.getByText(
    /^You'll receive your .+ once confirmed/,
  );
  private readonly signedCloseButton = this.signedDialog.locator('[aria-label="Close"]');

  @step("Verify the Perps transaction signed dialog")
  async expectTransactionSigned(receiverAccount: Account) {
    await expect(this.signedCta).toBeVisible();
    await this.softExpect(async soft => {
      await soft(this.signedTitle).toBeVisible();
      await soft(this.signedDescription).toContainText(receiverAccount.currency.ticker);
    });
  }

  @step("Close the Perps transaction signed dialog")
  async close() {
    await this.signedCloseButton.click();
    await expect(this.signedCta).toBeHidden();
  }
}
