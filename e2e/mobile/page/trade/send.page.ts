import { currencyParam, openDeeplink } from "../../helpers/commonHelpers";

export default class SendPage {
  baseLink = "send";
  summaryAmountId = "send-summary-amount";
  summaryMemoTagId = "summary-memo-tag";
  validationEnsId = "device-validation-domain";
  recipientContinueButtonId = "recipient-continue-button";
  recipientInputId = "recipient-input";
  recipientErrorId = "send-recipient-error";
  memoTagInputId = "memo-tag-input";
  memoTagDrawerTitleId = "memo-tag-drawer-title";
  memoTagIgnoreButtonId = "memo-tag-ignore-button";
  amountInputId = "amount-input";
  amountErrorId = "send-amount-error";
  summaryErrorId = "insufficient-fee-error";
  highFeeConfirmButtonID = "confirmation-modal-confirm-button";

  summaryRecipient = () => getElementById("send-summary-recipient");
  summaryRecipientEns = () => getElementById("send-summary-recipient-ens");
  summaryMemoTag = () => getElementById(this.summaryMemoTagId);
  getStep1HeaderTitle = () => getElementById("send-header-step1-title");
  amountMaxSwitch = () => getElementById("send-amount-max-switch");
  amountContinueButton = () => getElementById("amount-continue-button");
  summaryWarning = () => getElementById("send-summary-warning");
  summaryContinueButton = () => getElementById("summary-continue-button");
  feeStrategy = (fee: string) => getElementByText(fee);

  @Step("Open send via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  @Step("Send via deeplink")
  async sendViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? this.baseLink + currencyParam + currencyLong : this.baseLink;
    await openDeeplink(link);
  }

  @Step("Expect first step")
  async expectFirstStep() {
    const header = this.getStep1HeaderTitle();
    await detoxExpect(header).toBeVisible();
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
    await waitForElementById(this.recipientContinueButtonId);
    await tapById(this.recipientContinueButtonId);

    if (memoTag === "noTag") {
      await waitForElementById(this.memoTagDrawerTitleId);
      await tapById(this.memoTagIgnoreButtonId);
    }
  }

  @Step("Expect recipient error message")
  async expectSendRecipientError(errorMessage: string) {
    await this.expectRecipientMessage(errorMessage);
  }

  @Step("Expect recipient warning message")
  async expectSendRecipientWarning(expectedWarningMessage: string | null) {
    await this.expectRecipientMessage(expectedWarningMessage, true);
  }

  private async expectRecipientMessage(message: string | null, continueButtonVisible = false) {
    const errElem = getElementById(this.recipientErrorId);
    if (message) {
      await detoxExpect(errElem).toHaveText(message);
    } else {
      await detoxExpect(errElem).not.toBeVisible();
    }

    const contBtn = getElementById(this.recipientContinueButtonId);
    if (continueButtonVisible) {
      await detoxExpect(contBtn).toBeVisible();
    } else {
      await detoxExpect(contBtn).not.toBeVisible();
    }
  }

  @Step("Expect recipient step success")
  async expectSendRecipientSuccess(expectedWarningMessage?: string) {
    const errElem = getElementById(this.recipientErrorId);
    if (!expectedWarningMessage) {
      await detoxExpect(errElem).not.toBeVisible();
    } else {
      await detoxExpect(errElem).toHaveText(expectedWarningMessage);
    }
    const contBtn = getElementById(this.recipientContinueButtonId);
    await detoxExpect(contBtn).toBeVisible();
  }

  @Step("Set recipient and continue")
  async setRecipientAndContinue(address: string | undefined, memoTag?: string) {
    if (!address) {
      throw new Error("Recipient address is not set");
    }
    await this.setRecipient(address, memoTag);
    await this.recipientContinue(memoTag);
  }

  @Step("Set the amount and return the value")
  async setAmount(amount: string): Promise<string> {
    if (amount === "max") {
      const switchEl = this.amountMaxSwitch();
      await tapByElement(switchEl);
    } else {
      const input = getElementById(this.amountInputId);
      await input.replaceText(amount);
      await input.tapReturnKey();
    }

    return await getTextOfElement(this.amountInputId);
  }

  async amountContinue() {
    const btn = this.amountContinueButton();
    await tapByElement(btn);
  }

  @Step("Expect amount step success")
  async expectSendAmountSuccess() {
    const errElem = getElementById(this.amountErrorId);
    await detoxExpect(errElem).toHaveText("");
    const contBtn = this.amountContinueButton();
    await detoxExpect(contBtn).toBeVisible();
  }

  @Step("Expect amount error message")
  async expectSendAmountError(errorMessage: string) {
    const errElem = getElementById(this.amountErrorId);
    await detoxExpect(errElem).toHaveText(errorMessage);
    const contBtn = this.amountContinueButton();
    await detoxExpect(contBtn).not.toBeVisible();
  }

  @Step("Set amount and continue")
  async setAmountAndContinue(amount: string) {
    await this.setAmount(amount);
    await this.amountContinue();
  }

  @Step("Summary continue")
  async summaryContinue() {
    const btn = this.summaryContinueButton();
    await tapByElement(btn);
  }

  @Step("Expect amount in summary")
  async expectSummaryAmount(amount: string) {
    const amt = getElementById(this.summaryAmountId);
    await detoxExpect(amt).toHaveText(amount);
  }

  @Step("Expect max amount is within range in summary")
  async expectSummaryMaxAmount(amount: string, tolerance = 0.00005) {
    const text = await getTextOfElement(this.summaryAmountId);
    const summaryAmount = parseFloat(text.replace(/[^\d.-]/g, ""));
    const expected = parseFloat(amount);
    jestExpect(summaryAmount).toBeGreaterThanOrEqual(expected - tolerance);
    jestExpect(summaryAmount).toBeLessThanOrEqual(expected + tolerance);
  }

  @Step("Expect recipient in summary")
  async expectSummaryRecipient(recipient: string | undefined) {
    if (!recipient) {
      throw new Error("Recipient address is not set");
    }
    const rec = this.summaryRecipient();
    await detoxExpect(rec).toHaveText(recipient);
  }

  @Step("Expect error in summary")
  async expectSendSummaryError(errorMessage: RegExp) {
    const err = await getTextOfElement(this.summaryErrorId);
    jestExpect(err).toMatch(errorMessage);
    const btn = this.summaryContinueButton();
    await detoxExpect(btn).not.toBeVisible();
  }

  @Step("Expect warning in summary")
  async expectSummaryWarning(warningMessage: string) {
    const warn = this.summaryWarning();
    await detoxExpect(warn).toHaveText(warningMessage);
  }

  @Step("Expect recipient ENS in summary")
  async expectSummaryRecipientEns(ensName: string) {
    const ens = this.summaryRecipientEns();
    await detoxExpect(ens).toHaveText(ensName);
  }

  @Step("Expect memo tag in summary")
  async expectSummaryMemoTag(memoTag?: string) {
    if (memoTag && memoTag !== "noTag") {
      const memoEl = this.summaryMemoTag();
      await detoxExpect(memoEl).toHaveText(memoTag);
    } else if (await IsIdVisible(this.summaryMemoTagId)) {
      const memoEl = this.summaryMemoTag();
      await detoxExpect(memoEl).toHaveText("");
    }
  }

  @Step("Dismiss high fee modal if visible")
  async dismissHighFeeModal() {
    if (await IsIdVisible(this.highFeeConfirmButtonID)) {
      await tapById(this.highFeeConfirmButtonID);
    }
  }

  @Step("Expect ENS name in device validation screen")
  async expectValidationEnsName(ensName: string) {
    const elem = getElementById(this.validationEnsId);
    await detoxExpect(elem).toHaveText(ensName);
  }

  @Step("Choose fee strategy")
  async chooseFeeStrategy(fee?: string) {
    if (fee) {
      const feeBtn = this.feeStrategy(fee);
      await tapByElement(feeBtn);
    }
  }
}
