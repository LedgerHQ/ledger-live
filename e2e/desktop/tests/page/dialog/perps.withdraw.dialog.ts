import { expect } from "@playwright/test";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Dialog } from "tests/component/dialog.component";
import { step } from "tests/misc/reporters/step";

export class PerpsWithdrawDialog extends Dialog {
  private readonly title = this.page.getByRole("heading", { name: "Withdraw", exact: true });
  private readonly amountInput = this.page.getByTestId("perps-withdraw-amount-input");
  private readonly quotedAmount = this.page.getByText(/^Withdraw ~/);
  private readonly providerNotice = this.page.getByText(/^Swap and withdraw via /);
  private readonly ratioButtons = ["25%", "50%", "75%", "MAX"].map(label =>
    this.page.getByTestId(`perps-withdraw-ratio-${label}`),
  );
  private readonly selectCurrency = this.page.getByTestId("perps-withdraw-select-currency");
  private readonly reviewCta = this.page.getByTestId("perps-withdraw-review-cta");

  private readonly reviewTitle = this.page.getByRole("heading", { name: "Withdraw via SwapKit" });
  private readonly reviewSubtitle = this.page
    .getByText(/^Our partner SwapKit manages your swap and withdrawal/)
    .first();
  private readonly reviewBackButton = this.page.getByRole("button", { name: "Back" });
  private readonly swapDetailsTitle = this.page.getByText("Swap details", { exact: true });
  private readonly withdrawDetailsTitle = this.page.getByText("Withdraw details", { exact: true });
  private readonly amountSent = this.page.getByTestId("perps-withdraw-amount-sent");
  private readonly amountReceived = this.page.getByTestId("perps-withdraw-amount-received");
  private readonly receiverAccount = this.page.getByTestId("perps-withdraw-receiver-account");
  private readonly networkFees = this.page.getByTestId("perps-withdraw-network-fees");
  private readonly totalDebited = this.page.getByTestId("perps-withdraw-total-debited");
  private readonly withdrawCta = this.page.getByTestId("perps-withdraw-cta");

  @step("Verify the Perps withdraw form")
  async expectWithdrawForm() {
    await expect(this.title).toBeVisible();
    await expect(this.amountInput).toBeVisible();
    await expect(this.selectCurrency).toBeVisible();
    await expect(this.reviewCta).toBeDisabled();
    for (const ratioButton of this.ratioButtons) {
      await expect(ratioButton).toBeVisible();
    }
  }

  @step("Open the Perps withdraw receiving account picker")
  async openReceivingAccountPicker() {
    await this.selectCurrency.click();
  }

  @step("Verify the Perps withdraw receiving account is selected")
  async expectReceivingAccountSelected(account: Account) {
    await expect(this.selectCurrency).toContainText(account.currency.ticker);
    await expect(this.selectCurrency).toContainText(account.accountName);
  }

  @step("Enter the Perps withdraw amount")
  async enterAmount(amount: string) {
    await this.amountInput.fill(amount);
    await expect(this.quotedAmount).toBeVisible();
    await expect(this.providerNotice).toBeVisible();
  }

  @step("Continue to the Perps withdraw review")
  async clickReview() {
    await expect(this.reviewCta).toBeEnabled();
    await this.reviewCta.click();
  }

  @step("Verify the Perps withdraw review")
  async expectReview({
    sourceAccount,
    receiverAccount,
  }: {
    sourceAccount: Account;
    receiverAccount: Account;
  }) {
    await expect(this.reviewTitle).toBeVisible();
    await this.softExpect(async soft => {
      await soft(this.reviewSubtitle).toBeVisible();
      await soft(this.swapDetailsTitle).toBeVisible();
      await soft(this.withdrawDetailsTitle).toBeVisible();
    });
    await expect(this.reviewBackButton).toBeVisible();
    await expect(this.amountSent).toContainText(sourceAccount.currency.ticker);
    await expect(this.amountReceived).toContainText(
      new RegExp(String.raw`~[\d.,]+\s*${receiverAccount.currency.ticker}`),
    );
    await expect(this.receiverAccount).toContainText(receiverAccount.accountName);
    await expect(this.networkFees).toContainText(sourceAccount.currency.ticker);
    await expect(this.totalDebited).toContainText(sourceAccount.currency.ticker);
    await expect(this.withdrawCta).toBeEnabled();
  }

  @step("Confirm the Perps withdraw")
  async clickWithdraw() {
    await this.withdrawCta.click();
  }
}
