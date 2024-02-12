import {
  getElementById,
  tapById,
  waitForElementById,
  currencyParam,
  openDeeplink,
} from "../../helpers";

const baseLink = "send";

export default class SendPage {
  summaryAmount = () => getElementById("send-summary-amount");
  getStep1HeaderTitle = () => getElementById("send-header-step1-title");

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }

  async sendViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? baseLink + currencyParam + currencyLong : baseLink;

    await openDeeplink(link);
  }

  async selectAccount(accountId: string) {
    const id = "account-card-" + accountId;
    await waitForElementById(id);
    await tapById(id);
  }

  async setRecipient(address: string) {
    const element = getElementById("recipient-input");
    await element.replaceText(address);
    await element.tapReturnKey();
  }

  async recipientContinue() {
    await tapById("recipient-continue-button");
  }

  async setAmount(amount: string) {
    const element = getElementById("amount-input");
    await element.replaceText(amount);
    await element.tapReturnKey();
  }

  async amountContinue() {
    await tapById("amount-continue-button");
  }

  async summaryContinue() {
    await tapById("summary-continue-button");
  }

  async successContinue() {
    await waitForElementById("success-close-button");
    await tapById("success-close-button");
  }
}
