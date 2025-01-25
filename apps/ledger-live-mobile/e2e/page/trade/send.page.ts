import {
  getElementById,
  tapById,
  waitForElementById,
  currencyParam,
  openDeeplink,
  typeTextById,
  tapByElement,
  IsIdVisible,
} from "../../helpers";
import { expect } from "detox";

const baseLink = "send";

export default class SendPage {
  summaryAmount = () => getElementById("send-summary-amount");
  summaryRecipient = () => getElementById("send-summary-recipient");
  getStep1HeaderTitle = () => getElementById("send-header-step1-title");
  recipientContinueButtonId = "recipient-continue-button";
  recipientInputId = "recipient-input";
  amountInputId = "amount-input";
  amountContinueButton = () => getElementById("amount-continue-button");
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

  @Step("Dismiss high fee modal if visible")
  async dismissHighFeeModal() {
    if (await IsIdVisible(this.highFreeConfirmButtonID))
      await tapById(this.highFreeConfirmButtonID);
  }
}
