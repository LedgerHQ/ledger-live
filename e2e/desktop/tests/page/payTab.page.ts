import { expect, type Locator } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";

const DEPOSIT_OPTION_IDS = ["bankTransfer", "swap", "receive", "buy"] as const;

export type PayDepositOptionId = (typeof DEPOSIT_OPTION_IDS)[number];

export class PayTabPage extends AppPage {
  private readonly screen: Locator = this.page.getByTestId("paytab-screen");
  private readonly fundedState: Locator = this.page.getByTestId("pay-card-balance-funded-state");
  private readonly moreButton: Locator = this.page.getByTestId("more-tile");
  private readonly balanceAmount: Locator = this.page.getByTestId("pay-card-balance-amount");
  private readonly filterPill: Locator = this.page.getByTestId("pay-card-balance-filter-pill");
  private readonly filterPicker: Locator = this.page.getByTestId("pay-card-balance-filter-picker");
  private readonly filterConfirm: Locator = this.page.getByTestId(
    "pay-card-balance-filter-confirm",
  );
  private readonly depositTile: Locator = this.page.getByTestId("action-tile-deposit");
  private readonly requestTile: Locator = this.page.getByTestId("action-tile-request");
  private readonly payTile: Locator = this.page.getByTestId("action-tile-pay");
  private readonly successStep: Locator = this.page.getByTestId("pay-success-step");
  private readonly successClose: Locator = this.page.getByTestId("pay-success-close");
  private readonly depositOptions: Locator = this.page.getByTestId("pay-card-deposit-options");
  private readonly requestScreen: Locator = this.page.getByTestId("pay-request-receive");
  private readonly requestAddress: Locator = this.page.getByTestId("pay-request-receive-address");
  private readonly requestQr: Locator = this.page.getByTestId("pay-request-receive-qr-code");
  private readonly requestSave: Locator = this.page.getByTestId("pay-request-receive-save");
  private readonly requestCopy: Locator = this.page.getByTestId("pay-request-receive-copy");
  private readonly requestVerify: Locator = this.page.getByTestId("pay-request-receive-verify");
  private readonly requestVerifyHint: Locator = this.page.getByTestId(
    "pay-request-receive-verify-hint",
  );
  private readonly bankTransferIntro: Locator = this.page.getByTestId(
    "pay-bank-transfer-intro-dialog",
  );
  private readonly closeButton: Locator = this.page.getByRole("button", { name: "Close" });
  private readonly explorePay: Locator = this.page.getByRole("button", { name: "Explore Pay" });

  private filterOption(rowKey: string) {
    return this.page.getByTestId(`pay-card-balance-filter-option-${rowKey}`);
  }

  private depositOption(optionId: PayDepositOptionId) {
    return this.page.getByTestId(`pay-card-deposit-option-${optionId}`);
  }

  @step("Expect the Pay tab screen")
  async expectScreenVisible() {
    await expect(this.screen).toBeVisible();
  }

  @step("Dismiss the Pay feature tour when it is shown")
  async dismissFeatureTourIfVisible() {
    await expect(this.screen).toBeVisible();
    if (await this.explorePay.isVisible()) {
      await this.explorePay.click();
      await expect(this.explorePay).toBeHidden();
    }
  }

  @step("Expect the Pay tab to show a funded balance")
  async expectFundedBalance() {
    await expect(this.fundedState).toBeVisible();
  }

  @step("Expect the Pay tab to show the more button")
  async expectMoreButton() {
    await expect(this.moreButton).toBeVisible();
  }

  @step("Expect the balance amount")
  async expectBalanceAmount() {
    await expect(this.balanceAmount).toBeVisible();
    await expect(this.balanceAmount).toContainText(/\d/);
  }

  @step("Expect the filter pill to read $0")
  async expectFilterPill(label: string) {
    await expect(this.filterPill).toHaveText(label);
  }

  @step("Filter the balance on $0")
  async filterBalance(rowKey: string) {
    await this.filterPill.click();
    await expect(this.filterPicker).toBeVisible();
    await this.filterOption(rowKey).click();
    await this.filterConfirm.click();
  }

  @step("Open deposit options")
  async openDepositOptions() {
    await this.depositTile.click();
    await expect(this.depositOptions).toBeVisible();
  }

  @step("Expect the four deposit options")
  async expectDepositOptions() {
    for (const optionId of DEPOSIT_OPTION_IDS) {
      await expect(this.depositOption(optionId)).toBeVisible();
    }
  }

  @step("Select deposit option $0")
  async selectDepositOption(optionId: PayDepositOptionId) {
    await this.depositOption(optionId).click();
  }

  @step("Expect the bank transfer intro")
  async expectBankTransferIntro() {
    await expect(this.bankTransferIntro).toBeVisible();
  }

  @step("Close the bank transfer intro")
  async closeBankTransferIntro() {
    await this.bankTransferIntro.getByRole("button", { name: "Close" }).click();
    await expect(this.bankTransferIntro).toBeHidden();
  }

  @step("Open request")
  async openRequest() {
    await this.requestTile.click();
  }

  @step("Expect the request screen titled $0")
  async expectRequestTitle(title: string) {
    await expect(this.requestScreen).toBeVisible();
    await expect(this.requestScreen).toContainText(title);
  }

  @step("Expect the request address")
  async expectRequestAddress() {
    await expect(this.requestAddress).toBeVisible();
  }

  @step("Expect the request QR code")
  async expectRequestQrCode() {
    await expect(this.requestQr).toBeVisible();
  }

  @step("Expect the request Save action")
  async expectRequestSave() {
    await expect(this.requestSave).toBeVisible();
  }

  @step("Expect the request Copy action")
  async expectRequestCopy() {
    await expect(this.requestCopy).toBeVisible();
  }

  @step("Expect the request Verify action")
  async expectRequestVerify() {
    await expect(this.requestVerify).toBeVisible();
  }

  @step("Dismiss the verify address hint when it is shown")
  async dismissVerifyHintIfVisible() {
    try {
      await this.requestVerifyHint.waitFor({ state: "visible", timeout: 2_000 });
    } catch {
      return;
    }
    await this.requestVerifyHint.getByRole("button", { name: "Got it" }).click();
    await expect(this.requestVerifyHint).toBeHidden();
  }

  @step("Open a new payment")
  async openNewPayment() {
    await this.payTile.click();
  }

  @step("Expect the Pay success screen")
  async expectYouPaid() {
    await expect(this.successStep).toBeVisible();
    await expect(this.successStep).toContainText("You paid");
  }

  @step("Close the Pay success screen")
  async closePaySuccess() {
    await this.successClose.click();
    await expect(this.successStep).toBeHidden();
  }

  @step("Close the request dialog")
  async closeRequest() {
    await this.dismissVerifyHintIfVisible();
    await this.requestScreen.locator("..").getByRole("button", { name: "Close" }).click();
    await expect(this.requestScreen).toBeHidden();
  }

  @step("Close the open dialog")
  async closeDialog() {
    await this.closeButton.first().click();
  }
}
