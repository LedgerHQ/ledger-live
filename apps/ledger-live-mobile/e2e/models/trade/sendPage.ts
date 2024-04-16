import {
  getElementById,
  tapById,
  waitForElementById,
  currencyParam,
  openDeeplink,
  typeTextById,
  tapByElement,
} from "../../helpers";

const baseLink = "send";

export default class SendPage {
  summaryAmount = () => getElementById("send-summary-amount");
  getStep1HeaderTitle = () => getElementById("send-header-step1-title");
  accoundCardId = (id: string) => "account-card-" + id;
  recipientContinueButtonId = "recipient-continue-button";
  recipientInputId = "recipient-input";
  amountInputId = "amount-input";
  amountContinueButton = () => getElementById("amount-continue-button");
  summaryContinueButton = () => getElementById("summary-continue-button");
  successCloseButtonId = "success-close-button";

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }

  async sendViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? baseLink + currencyParam + currencyLong : baseLink;

    await openDeeplink(link);
  }

  async selectAccount(accountId: string) {
    const id = this.accoundCardId(accountId);
    await waitForElementById(id);
    await tapById(id);
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

  async successContinue() {
    await waitForElementById(this.successCloseButtonId);
    await tapById(this.successCloseButtonId);
  }
}
