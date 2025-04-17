import { expect } from "detox";
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
  highFeeConfirmButtonID = "confirmation-modal-confirm-button";
  feeStrategy = (fee: string) => getElementByText(fee);

  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  async sendViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? this.baseLink + currencyParam + currencyLong : this.baseLink;
    await openDeeplink(link);
  }

  async expectFirstStep() {
    const header = await this.getStep1HeaderTitle();
    await expect(header).toBeVisible();
  }

  @Step("Set recipient and memo tag")
  async setRecipient(address: string, memoTag?: string) {
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
    const errElem = await getElementById(this.recipientErrorId);
    if (errorMessage) {
      await expect(errElem).toHaveText(errorMessage);
    } else {
      await expect(errElem).not.toBeVisible();
    }
    const contBtn = await getElementById(this.recipientContinueButtonId);
    await expect(contBtn).not.toBeVisible();
  }

  @Step("Expect recipient step success")
  async expectSendRecipientSuccess(expectedWarningMessage?: string) {
    const errElem = await getElementById(this.recipientErrorId);
    if (!expectedWarningMessage) {
      await expect(errElem).not.toBeVisible();
    } else {
      await expect(errElem).toHaveText(expectedWarningMessage);
    }
    const contBtn = await getElementById(this.recipientContinueButtonId);
    await expect(contBtn).toBeVisible();
  }

  @Step("Set recipient and continue")
  async setRecipientAndContinue(address: string, memoTag?: string) {
    await this.setRecipient(address, memoTag);
    await this.recipientContinue(memoTag);
  }

  @Step("Set the amount and return the value")
  async setAmount(amount: string): Promise<string> {
    if (amount === "max") {
      const switchEl = await this.amountMaxSwitch();
      await tapByElement(switchEl);
    } else {
      const input = await getElementById(this.amountInputId);
      await input.replaceText(amount);
      await input.tapReturnKey();
    }

    return await getTextOfElement(this.amountInputId);
  }

  async amountContinue() {
    const btn = await this.amountContinueButton();
    await tapByElement(btn);
  }

  @Step("Expect amount step success")
  async expectSendAmountSuccess() {
    const errElem = await getElementById(this.amountErrorId);
    await expect(errElem).toHaveText("");
    const contBtn = await this.amountContinueButton();
    await expect(contBtn).toBeVisible();
  }

  @Step("Expect amount error message")
  async expectSendAmountError(errorMessage: string) {
    const errElem = await getElementById(this.amountErrorId);
    await expect(errElem).toHaveText(errorMessage);
    const contBtn = await this.amountContinueButton();
    await expect(contBtn).not.toBeVisible();
  }

  @Step("Set amount and continue")
  async setAmountAndContinue(amount: string) {
    await this.setAmount(amount);
    await this.amountContinue();
  }

  async summaryContinue() {
    const btn = await this.summaryContinueButton();
    await tapByElement(btn);
  }

  @Step("Expect amount in summary")
  async expectSummaryAmount(amount: string) {
    const amt = await getElementById(this.summaryAmountId);
    await expect(amt).toHaveText(amount);
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
  async expectSummaryRecipient(recipient: string) {
    const rec = await this.summaryRecipient();
    await expect(rec).toHaveText(recipient);
  }

  @Step("Expect error in summary")
  async expectSendSummaryError(errorMessage: RegExp) {
    const err = await getTextOfElement(this.summaryErrorId);
    jestExpect(err).toMatch(errorMessage);
    const btn = await this.summaryContinueButton();
    await expect(btn).not.toBeVisible();
  }

  @Step("Expect warning in summary")
  async expectSummaryWarning(warningMessage: string) {
    const warn = await this.summaryWarning();
    await expect(warn).toHaveText(warningMessage);
  }

  @Step("Expect recipient ENS in summary")
  async expectSummaryRecipientEns(ensName: string) {
    const ens = await this.summaryRecipientEns();
    await expect(ens).toHaveText(ensName);
  }

  @Step("Expect memo tag in summary")
  async expectSummaryMemoTag(memoTag?: string) {
    if (memoTag && memoTag !== "noTag") {
      const memoEl = await this.summaryMemoTag();
      await expect(memoEl).toHaveText(memoTag);
    } else if (await IsIdVisible(this.summaryMemoTagId)) {
      const memoEl = await this.summaryMemoTag();
      await expect(memoEl).toHaveText("");
    }
  }

  @Step("Dismiss high fee modal if visible")
  async dismissHighFeeModal() {
    if (await IsIdVisible(this.highFeeConfirmButtonID)) {
      await tapById(this.highFeeConfirmButtonID);
    }
  }

  @Step("Expect amount in device validation screen")
  async expectValidationAmount(amount: string) {
    const elem = await getElementById(this.validationAmountId);
    await expect(elem).toHaveText(amount);
  }

  @Step("Expect address in device validation screen")
  async expectValidationAddress(recipient: string) {
    const elem = await getElementById(this.validationAddressId);
    await expect(elem).toHaveText(recipient);
  }

  @Step("Expect ENS name in device validation screen")
  async expectValidationEnsName(ensName: string) {
    const elem = await getElementById(this.validationEnsId);
    await expect(elem).toHaveText(ensName);
  }

  @Step("Choose fee strategy")
  async chooseFeeStrategy(fee?: string) {
    if (fee) {
      const feeBtn = await this.feeStrategy(fee);
      await tapByElement(feeBtn);
    }
  }
}
