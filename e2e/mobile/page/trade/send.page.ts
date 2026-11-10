import { Step } from "jest-allure2-reporter/api";
import { currencyParam, openDeeplink } from "@e2e/helpers/commonHelpers";
import { byId, byText } from "@e2e/helpers/elements/native";

export default class SendPage {
  private readonly baseLink = "send";

  private readonly step1HeaderTitle = byId("send-header-step1-title");
  private readonly recipientInput = byId("recipient-input");
  private readonly recipientError = byId("send-recipient-error");
  private readonly recipientContinueEnabledButton = byId("enabled-recipient-continue-button");
  private readonly recipientContinueDisabledButton = byId("disabled-recipient-continue-button");
  private readonly memoTagInput = byId("memo-tag-input");
  private readonly memoTagDrawerTitle = byId("memo-tag-drawer-title");
  private readonly memoTagIgnoreButton = byId("enabled-memo-tag-ignore-button");
  private readonly amountInput = byId("amount-input");
  private readonly amountMaxSwitch = byId("send-amount-max-switch");
  private readonly amountError = byId("send-amount-error");
  private readonly amountContinueEnabledButton = byId("enabled-amount-continue-button");
  private readonly amountContinueDisabledButton = byId("disabled-amount-continue-button");
  private readonly summaryAmount = byId("send-summary-amount");
  private readonly summaryRecipient = byId("send-summary-recipient");
  private readonly summaryRecipientEns = byId("send-summary-recipient-ens");
  private readonly summaryMemoTag = byId("summary-memo-tag");
  private readonly summaryWarning = byId("send-summary-warning");
  private readonly summaryError = byId("insufficient-fee-error");
  private readonly summaryContinueEnabledButton = byId("enabled-summary-continue-button");
  private readonly summaryContinueDisabledButton = byId("disabled-summary-continue-button");
  private readonly highFeeConfirmButton = byId("enabled-confirmation-modal-confirm-button");
  private readonly validationEns = byId("device-validation-domain");
  // The fee strategy rows have no testID.
  private readonly feeStrategy = (fee: string) => byText(fee);

  @Step("Navigate to send screen {{{0}}}")
  async navigateToSendScreen(accountName: string) {
    await app.account.openViaDeeplink();
    await app.account.goToAccountByName(accountName);
    await app.account.tapSend();
  }

  @Step("Open send via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  @Step("Send via deeplink {{{0}}}")
  async sendViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? this.baseLink + currencyParam + currencyLong : this.baseLink;
    await openDeeplink(link);
  }

  @Step("Expect first step")
  async expectFirstStep() {
    await this.step1HeaderTitle.expectVisible();
  }

  @Step("Set recipient {{{0}}} and memo tag {{{1}}}")
  async setRecipient(address: string, memoTag?: string) {
    await this.recipientInput.replaceText(address); // Issue with RN75 : QAA-370
    if (memoTag && memoTag !== "noTag") {
      await this.memoTagInput.replaceText(memoTag);
    }
  }

  @Step("Continue to next step and skip memo tag if needed {{{0}}}")
  async recipientContinue(memoTag?: string) {
    await this.recipientContinueEnabledButton.tap();

    if (memoTag === "noTag") {
      await this.memoTagDrawerTitle.waitVisible();
      await this.memoTagIgnoreButton.tap();
    }
  }

  @Step("Expect recipient error message {{{0}}}")
  async expectSendRecipientError(errorMessage: string) {
    await this.expectRecipientMessage(errorMessage);
  }

  @Step("Expect recipient warning message {{{0}}}")
  async expectSendRecipientWarning(expectedWarningMessage: string | null) {
    await this.expectRecipientMessage(expectedWarningMessage, true);
  }

  private async expectRecipientMessage(message: string | null, continueButtonVisible = false) {
    if (message) {
      await this.recipientError.expectText(message);
    } else {
      await this.recipientError.expectNotVisible();
    }

    if (continueButtonVisible) {
      await this.recipientContinueEnabledButton.expectVisible();
    } else {
      await this.recipientContinueEnabledButton.expectNotVisible();
      await this.recipientContinueDisabledButton.expectVisible();
    }
  }

  @Step("Expect recipient step success {{{0}}}")
  async expectSendRecipientSuccess(expectedWarningMessage?: string) {
    if (expectedWarningMessage) {
      await this.recipientError.expectText(expectedWarningMessage);
    } else {
      await this.recipientError.expectNotVisible();
    }
    await this.recipientContinueEnabledButton.expectVisible();
  }

  @Step("Set recipient {{{0}}} and continue")
  async setRecipientAndContinue(address: string | undefined, memoTag?: string) {
    if (!address) {
      throw new Error("Recipient address is not set");
    }
    await this.setRecipient(address, memoTag);
    await this.recipientContinue(memoTag);
  }

  @Step("Set the amount and return the value {{{0}}}")
  async setAmount(amount: string): Promise<string> {
    if (amount === "max") {
      await this.amountMaxSwitch.tap();
    } else {
      await this.amountInput.replaceText(amount);
    }

    return await this.amountInput.getText();
  }

  @Step("Continue from the amount step")
  async amountContinue() {
    await this.amountContinueEnabledButton.tap();
  }

  @Step("Expect amount step success")
  async expectSendAmountSuccess() {
    await this.amountError.expectText("");
    await this.amountContinueEnabledButton.expectVisible();
  }

  @Step("Expect amount error message {{{0}}}")
  async expectSendAmountError(errorMessage: string) {
    await this.amountError.expectText(errorMessage);
    await this.amountContinueEnabledButton.expectNotVisible();
    await this.amountContinueDisabledButton.expectVisible();
  }

  @Step("Set amount and continue {{{0}}}")
  async setAmountAndContinue(amount: string) {
    await this.setAmount(amount);
    await this.amountContinue();
  }

  @Step("Summary continue")
  async summaryContinue() {
    await this.summaryContinueEnabledButton.tap();
  }

  @Step("Expect amount in summary {{{0}}}")
  async expectSummaryAmount(amount: string) {
    await this.summaryAmount.expectText(amount);
  }

  @Step("Expect max amount is within range in summary {{{0}}}")
  async expectSummaryMaxAmount(amount: string, tolerance = 0.00005) {
    const text = await this.summaryAmount.getText();
    const summaryAmount = Number.parseFloat(text.replaceAll(/[^\d.-]/g, ""));
    const expected = Number.parseFloat(amount);
    jestExpect(summaryAmount).toBeGreaterThanOrEqual(expected - tolerance);
    jestExpect(summaryAmount).toBeLessThanOrEqual(expected + tolerance);
  }

  @Step("Expect recipient in summary {{{0}}}")
  async expectSummaryRecipient(recipient: string | undefined) {
    if (!recipient) {
      throw new Error("Recipient address is not set");
    }
    await this.summaryRecipient.expectText(recipient);
  }

  @Step("Expect error in summary {{{0}}}")
  async expectSendSummaryError(errorMessage: RegExp) {
    await this.summaryError.expectTextMatching(errorMessage);
    await this.summaryContinueEnabledButton.expectNotVisible();
    await this.summaryContinueDisabledButton.expectVisible();
  }

  @Step("Expect warning in summary {{{0}}}")
  async expectSummaryWarning(warningMessage: string) {
    await this.summaryWarning.expectText(warningMessage);
  }

  @Step("Expect recipient ENS in summary {{{0}}}")
  async expectSummaryRecipientEns(ensName: string) {
    await this.summaryRecipientEns.expectText(ensName);
  }

  @Step("Expect validation ENS name {{{0}}}")
  async expectValidationEnsName(ensName: string) {
    await this.validationEns.expectText(ensName);
  }

  @Step("Expect memo tag in summary {{{0}}}")
  async expectSummaryMemoTag(memoTag?: string) {
    if (memoTag && memoTag !== "noTag") {
      await this.summaryMemoTag.expectText(memoTag);
    } else if (await this.summaryMemoTag.isVisible()) {
      await this.summaryMemoTag.expectText("");
    }
  }

  @Step("Dismiss high fee modal if visible")
  async dismissHighFeeModal() {
    if (await this.highFeeConfirmButton.isVisible()) {
      await this.highFeeConfirmButton.tap();
    }
  }

  @Step("Choose fee strategy {{{0}}}")
  async chooseFeeStrategy(fee?: string) {
    if (fee) {
      await this.feeStrategy(fee).scrollTo();
      await this.feeStrategy(fee).tap();
    }
  }
}
