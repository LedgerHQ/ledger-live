import { expect } from "@playwright/test";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Dialog } from "tests/component/dialog.component";
import { step } from "tests/misc/reporters/step";
import { extractAmountText } from "@ledgerhq/live-e2e-shared/amountText";

export class PerpsDepositDialog extends Dialog {
  private readonly title = this.page.getByRole("heading", { name: "Deposit", exact: true });
  private readonly amountInput = this.page.getByTestId("perps-deposit-amount-input");
  private readonly quotedAmount = this.page.getByText(/^Deposit ~/);
  private readonly providerNotice = this.page.getByText(/^Swap and deposit via /);
  private readonly ratioButtons = ["25%", "50%", "75%", "MAX"].map(label =>
    this.page.getByTestId(`perps-deposit-ratio-${label}`),
  );
  private readonly selectCurrency = this.page.getByTestId("perps-deposit-select-currency");
  private readonly reviewCta = this.page.getByTestId("perps-deposit-review-cta");

  private readonly reviewTitle = this.page.getByRole("heading", { name: "Deposit via SwapKit" });
  private readonly reviewDialog = this.page.getByRole("dialog", { name: "Deposit via SwapKit" });
  private readonly reviewBackButton = this.page.getByRole("button", { name: "Back" });
  private readonly swapDetailsTitle = this.page.getByText("Swap details", { exact: true });
  private readonly depositDetailsTitle = this.page.getByText("Deposit details", { exact: true });
  private readonly amountSent = this.page.getByTestId("perps-deposit-amount-sent");
  private readonly amountReceived = this.page.getByTestId("perps-deposit-amount-received");
  private readonly depositedAmount = this.page.getByTestId("perps-deposit-deposited-amount");
  private readonly receiverAccount = this.page.getByTestId("perps-deposit-receiver-account");
  private readonly depositCta = this.page.getByTestId("perps-deposit-cta");

  private readonly signTerms = this.page.getByText(
    /^By signing this transaction, I accept SwapKit/,
  );

  @step("Verify the Perps deposit form")
  async expectDepositForm() {
    await expect(this.title).toBeVisible();
    await expect(this.amountInput).toBeVisible();
    await expect(this.selectCurrency).toBeVisible();
    await expect(this.reviewCta).toBeDisabled();
    await Promise.all(this.ratioButtons.map(ratioButton => expect(ratioButton).toBeVisible()));
  }

  @step("Open the Perps deposit funding account picker")
  async openFundingAccountPicker() {
    await this.selectCurrency.click();
  }

  @step("Verify the Perps deposit funding account is selected")
  async expectFundingAccountSelected(account: Account) {
    await expect(this.selectCurrency).toContainText(account.currency.ticker);
  }

  @step("Enter the Perps deposit amount")
  async enterAmount(amount: string) {
    await this.amountInput.fill(amount);
    await expect(this.quotedAmount).toBeVisible();
    await expect(this.providerNotice).toBeVisible();
  }

  @step("Continue to the Perps deposit review")
  async clickReview() {
    await expect(this.reviewCta).toBeEnabled();
    await this.reviewCta.click();
  }

  @step("Verify the Perps deposit review")
  async expectReview({
    fundingAccount,
    receiverAccount,
  }: {
    fundingAccount: Account;
    receiverAccount: Account;
  }) {
    await expect(this.reviewTitle).toBeVisible();
    await this.softExpect(async soft => {
      await soft(this.reviewDialog).toHaveAccessibleDescription(
        /^Our partner SwapKit manages your swap/,
      );
      await soft(this.swapDetailsTitle).toBeVisible();
      await soft(this.depositDetailsTitle).toBeVisible();
    });
    await expect(this.reviewBackButton).toBeVisible();
    await expect(this.amountSent).toContainText(fundingAccount.currency.ticker);
    await expect(this.amountReceived).toContainText(
      new RegExp(String.raw`~[\d.,]+\s*${receiverAccount.currency.ticker}`),
    );
    await expect(this.depositedAmount).toContainText(receiverAccount.currency.ticker);
    await expect(this.receiverAccount).toContainText(receiverAccount.accountName);
    await expect(this.depositCta).toBeEnabled();
  }

  @step("Read the Perps deposit review send amount")
  async getReviewSendAmount(fundingAccount: Account) {
    const ticker = fundingAccount.currency.ticker;
    return { ticker, amount: extractAmountText(await this.amountSent.innerText(), ticker) };
  }

  @step("Confirm the Perps deposit")
  async clickDeposit() {
    await this.depositCta.click();
  }

  @step("Verify the Perps deposit signing dialog")
  async expectSigning() {
    await expect(this.signTerms).toBeVisible();
  }
}
