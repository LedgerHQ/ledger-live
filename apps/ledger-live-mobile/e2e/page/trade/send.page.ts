import { expect } from "detox";
import { currencyParam, openDeeplink } from "../../helpers/commonHelpers";

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

  @Step("Set recipient and memo tag")
  async setRecipient(address: string, memoTag?: string) {
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

  async summaryContinue() {
    await tapByElement(this.summaryContinueButton());
  }

  @Step("Expect amount in summary")
  async expectSummaryAmount(amount: string) {
    await expect(getElementById(this.summaryAmountId)).toHaveText(amount);
  }
}
