import { expect } from "detox";
import { currencyParam, openDeeplink } from "../../helpers/commonHelpers";
import { TradePageUtil } from "./trade-page.util";

export default class SendPage {
  baseLink = "send";
  summaryAmountId = "send-summary-amount";
  getStep1HeaderTitle = () => getElementById("send-header-step1-title");
  recipientContinueButtonId = "recipient-continue-button";
  recipientInputId = "recipient-input";
  memoTagInputId = "memo-tag-input";
  memoTagDrawerTitleId = "memo-tag-drawer-title";
  memoTagIgnoreButtonId = "memo-tag-ignore-button";
  amountInputId = "amount-input";
  amountMaxSwitch = () => getElementById("send-amount-max-switch");
  amountContinueButton = () => getElementById("amount-continue-button");
  summaryContinueButton = () => getElementById("summary-continue-button");
  recipientErrorId = "send-recipient-error";
  recipientErrorDescriptionId = "send-recipient-error-description";
  learnMoreLinkId = "learn-more-link";
  senderErrorTitleId = "send-sender-error-title";
  senderErrorDescriptionId = "send-sender-error-description";
  summaryErrorTitleId = "send-summary-error-title";
  summaryErrorDescriptionId = "send-summary-error-description";

  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  async sendViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? this.baseLink + currencyParam + currencyLong : this.baseLink;
    await openDeeplink(link);
  }

  async expectFirstStep() {
    await expect(this.getStep1HeaderTitle()).toBeVisible();
  }

  async setRecipient(address: string, memoTag?: string) {
    await typeTextById(this.recipientInputId, address);
    if (memoTag && memoTag !== "noTag") {
      await typeTextById(this.memoTagInputId, memoTag);
    }
  }

  async recipientContinue(memoTag?: string) {
    await waitForElementById(this.recipientContinueButtonId); // To prevent flakiness
    await tapById(this.recipientContinueButtonId);
    if (memoTag == "noTag") {
      await waitForElementById(this.memoTagDrawerTitleId);
      await tapById(this.memoTagIgnoreButtonId);
    }
  }

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

  async summaryContinue() {
    await tapByElement(this.summaryContinueButton());
  }

  async expectSummaryAmount(amount: string) {
    await expect(getElementById(this.summaryAmountId)).toHaveText(amount);
  }

  async selectAccount(account: string) {
    await TradePageUtil.selectAccount(account);
  }

  async expectSendRecipientTitleError(errorMessage: string) {
    await this.expectElementToHaveText(this.recipientErrorId, errorMessage);
  }

  async expectSendRecipientDescriptionError(errorMessage: string) {
    await this.expectElementToHaveText(this.recipientErrorDescriptionId, errorMessage);
  }

  async expectLearnMoreLink() {
    await expect(getElementById(this.learnMoreLinkId)).toBeVisible();
  }

  async expectContinueButtonDisabled() {
    await expect(getElementById(this.recipientContinueButtonId)).not.toBeVisible();
  }

  async expectSendSenderTitleError(errorMessage: string) {
    await this.expectElementToHaveText(this.senderErrorTitleId, errorMessage);
  }

  async expectSendSenderDescriptionError(errorMessage: string) {
    await this.expectElementToHaveText(this.senderErrorDescriptionId, errorMessage);
  }

  async expectSendSummaryTitleError(errorMessage: string) {
    await this.expectElementToHaveText(this.summaryErrorTitleId, errorMessage);
  }

  async expectSendSummaryDescriptionError(errorMessage: string) {
    await this.expectElementToHaveText(this.summaryErrorDescriptionId, errorMessage);
  }

  private async expectElementToHaveText(elementId: string, message: string) {
    const element = getElementById(elementId);
    await expect(element).toHaveText(message);
  }
}
