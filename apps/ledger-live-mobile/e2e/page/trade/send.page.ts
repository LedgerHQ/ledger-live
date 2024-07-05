import {
  getElementById,
  tapById,
  waitForElementById,
  currencyParam,
  openDeeplink,
  typeTextById,
  tapByElement,
} from "../../helpers";
import { expect } from "detox";

const baseLink = "send";

export default class SendPage {
  summaryAmount = () => getElementById("send-summary-amount");
  getStep1HeaderTitle = () => getElementById("send-header-step1-title");
  recipientContinueButtonId = "recipient-continue-button";
  recipientInputId = "recipient-input";
  amountInputId = "amount-input";
  amountContinueButton = () => getElementById("amount-continue-button");
  summaryContinueButton = () => getElementById("summary-continue-button");

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

  async setAmount(amount: string) {
    const element = getElementById(this.amountInputId);
    await element.replaceText(amount);
    await element.tapReturnKey();
  }

  async amountContinue() {
    await tapByElement(this.amountContinueButton());
  }

  async summaryContinue() {
    await tapByElement(this.summaryContinueButton());
  }

  async expectSummaryAmount(amount: string) {
    await expect(this.summaryAmount()).toHaveText(amount);
  }
}
