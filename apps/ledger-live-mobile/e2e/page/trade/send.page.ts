import {
  getElementById,
  tapById,
  waitForElementById,
  currencyParam,
  openDeeplink,
  typeTextById,
  tapByElement,
  IsIdVisible,
  getTextOfElement,
} from "../../helpers";
import { expect } from "detox";
import jestExpect from "expect";

const baseLink = "send";

export default class SendPage {
  summaryAmount = () => getElementById("send-summary-amount");
  summaryRecipient = () => getElementById("send-summary-recipient");
  summaryRecipientEns = () => getElementById("send-summary-recipient-ens");
  validationAmountId = "send-validation-amount";
  validationAddressId = "send-validation-address";
  validationEnsId = "send-validation-domain";
  getStep1HeaderTitle = () => getElementById("send-header-step1-title");
  recipientContinueButtonId = "recipient-continue-button";
  recipientInputId = "recipient-input";
  recipientErrorId = "send-recipient-error";
  amountInputId = "amount-input";
  amountErrorId = "send-amount-error";
  amountMaxSwitch = () => getElementById("send-amount-max-switch");
  amountContinueButton = () => getElementById("amount-continue-button");
  summaryErrorId = "insufficient-fee-error";
  summaryWarning = () => getElementById("send-summary-warning");
  summaryContinueButton = () => getElementById("summary-continue-button");
  highFreeConfirmButtonID = "confirmation-modal-confirm-button";

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }

  async sendViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? baseLink + currencyParam + currencyLong : baseLink;
    await openDeeplink(link);
  }

  async expectFirstStep() {
    await expect(this.getStep1HeaderTitle()).toBeVisible();
  }

  async setRecipient(address: string) {
    await typeTextById(this.recipientInputId, address);
  }

  async recipientContinue() {
    await waitForElementById(this.recipientContinueButtonId); // To prevent flakiness
    await tapById(this.recipientContinueButtonId);
  }

  @Step("Expect recipient error message")
  async expectSendRecipientError(errorMessage: string) {
    if (errorMessage) await expect(getElementById(this.recipientErrorId)).toHaveText(errorMessage);
    else await expect(getElementById(this.recipientErrorId)).not.toBeVisible();
    await expect(getElementById(this.recipientContinueButtonId)).not.toBeVisible();
  }

  @Step("Expect recipient step success")
  async expectSendRecipientSuccess(expectedWarningMessage?: string) {
    if (!expectedWarningMessage)
      await expect(getElementById(this.recipientErrorId)).not.toBeVisible();
    else await expect(getElementById(this.recipientErrorId)).toHaveText(expectedWarningMessage);
    await expect(getElementById(this.recipientContinueButtonId)).toBeVisible();
  }

  @Step("Set recipient and continue")
  async setRecipientAndContinue(address: string) {
    await this.setRecipient(address);
    await this.recipientContinue();
  }

  async setAmount(amount: string) {
    const element = getElementById(this.amountInputId);
    await element.replaceText(amount);
    await element.tapReturnKey();
  }

  async amountContinue() {
    await tapByElement(this.amountContinueButton());
  }

  @Step("Expect amount step success")
  async expectSendAmountSuccess() {
    await expect(getElementById(this.amountErrorId)).toHaveText("");
    await expect(this.amountContinueButton()).toBeVisible();
  }

  @Step("Expect amount error message")
  async expectSendAmountError(errorMessage: string) {
    await expect(getElementById(this.amountErrorId)).toHaveText(errorMessage);
    await expect(this.amountContinueButton()).not.toBeVisible();
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
    await expect(this.summaryAmount()).toHaveText(amount);
  }

  @Step("Expect recipient in summary")
  async expectSummaryRecepient(recipient: string) {
    await expect(this.summaryRecipient()).toHaveText(recipient);
  }

  @Step("Expect error in summary")
  async expectSendSummaryError(errorMessage: RegExp) {
    const error = await getTextOfElement(this.summaryErrorId);
    jestExpect(error).toMatch(errorMessage);
    await expect(this.summaryContinueButton()).not.toBeVisible();
  }

  @Step("Expect warning in summary")
  async expectSummaryWarning(warningMessage: string) {
    await expect(this.summaryWarning()).toHaveText(warningMessage);
  }

  @Step("Expect recipient ENS in summary")
  async expectSummaryRecepientEns(ensName: string) {
    await expect(this.summaryRecipientEns()).toHaveText(ensName);
  }

  @Step("Dismiss high fee modal if visible")
  async dismissHighFeeModal() {
    if (await IsIdVisible(this.highFreeConfirmButtonID))
      await tapById(this.highFreeConfirmButtonID);
  }

  @Step("Expect amount in device validation screen")
  async expectValidationAmount(amount: string) {
    await waitForElementById(this.validationAmountId);
    await expect(getElementById(this.validationAmountId)).toHaveText(amount);
  }

  @Step("Expect address in device validation screen")
  async expectValidationAddress(recipient: string) {
    await waitForElementById(this.validationAddressId);
    await expect(getElementById(this.validationAddressId)).toHaveText(recipient);
  }

  @Step("Expect ENS name in device validation screen")
  async expectValidationEnsName(ensName: string) {
    await waitForElementById(this.validationEnsId);
    await expect(getElementById(this.validationEnsId)).toHaveText(ensName);
  }
}
