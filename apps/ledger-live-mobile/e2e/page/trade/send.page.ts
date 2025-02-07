import { currencyParam, openDeeplink } from "../../helpers/commonHelpers";

export default class SendPage {
  baseLink = "send";
  summaryAmountId = "send-summary-amount";
  summaryRecipient = () => getElementById("send-summary-recipient");
  summaryRecipientEns = () => getElementById("send-summary-recipient-ens");
  summaryMemoTagId = "summary-memo-tag";
  summaryMemoTag = () => getElementById(this.summaryMemoTagId);
  validationAmountId = "device-validation-amount";
  validationAddressId = "device-validation-address";
  validationEnsId = "device-validation-domain";
  getStep1HeaderTitle = () => getElementById("send-header-step1-title");
  recipientContinueButtonId = "recipient-continue-button";
  recipientInputId = "recipient-input";
  recipientErrorId = "send-recipient-error";
  memoTagInputId = "memo-tag-input";
  memoTagDrawerTitleId = "memo-tag-drawer-title";
  memoTagIgnoreButtonId = "memo-tag-ignore-button";
  amountInputId = "amount-input";
  amountErrorId = "send-amount-error";
  amountMaxSwitch = () => getElementById("send-amount-max-switch");
  amountContinueButton = () => getElementById("amount-continue-button");
  summaryErrorId = "insufficient-fee-error";
  summaryWarning = () => getElementById("send-summary-warning");
  summaryContinueButton = () => getElementById("summary-continue-button");
  highFreeConfirmButtonID = "confirmation-modal-confirm-button";
  feeStrategy = (fee: string) => getElementByText(fee);

  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  async sendViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? this.baseLink + currencyParam + currencyLong : this.baseLink;
    await openDeeplink(link);
  }

  async expectFirstStep() {
    await detoxExpect(this.getStep1HeaderTitle()).toBeVisible();
  }

  @Step("Set recipient and memo tag")
  async setRecipient(address: string, memoTag?: string) {
    await waitForElementById(this.recipientInputId); // Issue with RN75 : QAA-370
    await typeTextById(this.recipientInputId, address);
    if (memoTag && memoTag !== "noTag") {
      await typeTextById(this.memoTagInputId, memoTag);
    }
  }

  @Step("Continue to next step and skip memo tag if needed")
  async recipientContinue(memoTag?: string) {
    await waitForElementById(this.recipientContinueButtonId); // To prevent flakiness
    await tapById(this.recipientContinueButtonId);
    if (memoTag == "noTag") {
      await waitForElementById(this.memoTagDrawerTitleId);
      await tapById(this.memoTagIgnoreButtonId);
    }
  }

  @Step("Expect recipient error message")
  async expectSendRecipientError(errorMessage: string) {
    if (errorMessage)
      await detoxExpect(getElementById(this.recipientErrorId)).toHaveText(errorMessage);
    else await detoxExpect(getElementById(this.recipientErrorId)).not.toBeVisible();
    await detoxExpect(getElementById(this.recipientContinueButtonId)).not.toBeVisible();
  }

  @Step("Expect recipient step success")
  async expectSendRecipientSuccess(expectedWarningMessage?: string) {
    if (!expectedWarningMessage)
      await detoxExpect(getElementById(this.recipientErrorId)).not.toBeVisible();
    else
      await detoxExpect(getElementById(this.recipientErrorId)).toHaveText(expectedWarningMessage);
    await detoxExpect(getElementById(this.recipientContinueButtonId)).toBeVisible();
  }

  @Step("Set recipient and continue")
  async setRecipientAndContinue(address: string, memoTag?: string) {
    await this.setRecipient(address, memoTag);
    await this.recipientContinue(memoTag);
  }

  @Step("Set the amount and return the value")
  async setAmount(amount: string) {
    if (amount === "max") await tapByElement(this.amountMaxSwitch());
    else {
      const element = getElementById(this.amountInputId);
      await element.replaceText(amount);
      await element.tapReturnKey();
    }
    return await getTextOfElement(this.amountInputId);
  }

  async amountContinue() {
    await tapByElement(this.amountContinueButton());
  }

  @Step("Expect amount step success")
  async expectSendAmountSuccess() {
    await detoxExpect(getElementById(this.amountErrorId)).toHaveText("");
    await detoxExpect(this.amountContinueButton()).toBeVisible();
  }

  @Step("Expect amount error message")
  async expectSendAmountError(errorMessage: string) {
    await detoxExpect(getElementById(this.amountErrorId)).toHaveText(errorMessage);
    await detoxExpect(this.amountContinueButton()).not.toBeVisible();
  }

  @Step("Set amount and continue")
  async setAmountAndContinue(amount: string) {
    await this.setAmount(amount);
    await this.amountContinue();
  }

  async summaryContinue() {
    await tapByElement(this.summaryContinueButton());
  }

  @Step("Expect amount in summary")
  async expectSummaryAmount(amount: string) {
    await detoxExpect(getElementById(this.summaryAmountId)).toHaveText(amount);
  }

  @Step("Expect max amount is within range in summary")
  async expectSummaryMaxAmount(amount: string, tolerance = 0.00005) {
    const summaryAmount = parseFloat(
      (await getTextOfElement(this.summaryAmountId)).replace(/[^\d.-]/g, ""),
    );
    const expectedAmount = parseFloat(amount);
    // Check if the actual amount is within the tolerance range
    jestExpect(summaryAmount).toBeGreaterThanOrEqual(expectedAmount - tolerance);
    jestExpect(summaryAmount).toBeLessThanOrEqual(expectedAmount + tolerance);
  }

  @Step("Expect recipient in summary")
  async expectSummaryRecipient(recipient: string) {
    await detoxExpect(this.summaryRecipient()).toHaveText(recipient);
  }

  @Step("Expect error in summary")
  async expectSendSummaryError(errorMessage: RegExp) {
    const error = await getTextOfElement(this.summaryErrorId);
    jestExpect(error).toMatch(errorMessage);
    await detoxExpect(this.summaryContinueButton()).not.toBeVisible();
  }

  @Step("Expect warning in summary")
  async expectSummaryWarning(warningMessage: string) {
    await detoxExpect(this.summaryWarning()).toHaveText(warningMessage);
  }

  @Step("Expect recipient ENS in summary")
  async expectSummaryRecipientEns(ensName: string) {
    await detoxExpect(this.summaryRecipientEns()).toHaveText(ensName);
  }

  @Step("Expect memo tag in summary")
  async expectSummaryMemoTag(memoTag?: string) {
    if (memoTag && memoTag !== "noTag")
      await detoxExpect(this.summaryMemoTag()).toHaveText(memoTag);
    else if (await IsIdVisible(this.summaryMemoTagId)) {
      await detoxExpect(this.summaryMemoTag()).toHaveText("");
    }
  }

  @Step("Dismiss high fee modal if visible")
  async dismissHighFeeModal() {
    if (await IsIdVisible(this.highFreeConfirmButtonID))
      await tapById(this.highFreeConfirmButtonID);
  }

  @Step("Expect amount in device validation screen")
  async expectValidationAmount(amount: string) {
    await waitForElementById(this.validationAmountId);
    await detoxExpect(getElementById(this.validationAmountId)).toHaveText(amount);
  }

  @Step("Expect address in device validation screen")
  async expectValidationAddress(recipient: string) {
    await waitForElementById(this.validationAddressId);
    await detoxExpect(getElementById(this.validationAddressId)).toHaveText(recipient);
  }

  @Step("Expect ENS name in device validation screen")
  async expectValidationEnsName(ensName: string) {
    await waitForElementById(this.validationEnsId);
    await detoxExpect(getElementById(this.validationEnsId)).toHaveText(ensName);
  }

  @Step("choose fee startegy")
  async chooseFeeStrategy(fee: string | undefined) {
    if (fee) {
      await tapByElement(this.feeStrategy(fee));
    }
  }
}
