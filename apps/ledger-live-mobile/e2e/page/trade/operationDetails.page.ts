import { getElementById, scrollToId, waitForElementById } from "../../helpers";
import { expect } from "detox";

export default class OperationDetailsPage {
  titleId = "operationDetails-title";
  title = () => getElementById(this.titleId);
  account = () => getElementById("operationDetails-account");
  amount = () => getElementById("operationDetails-amount");
  recipientId = "operationDetails-recipient0";

  async isOpened() {
    await expect(this.title()).toBeVisible();
  }

  @Step("Wait for operation details")
  async waitForOperationDetails() {
    await waitForElementById(this.titleId);
  }

  @Step("Check account details")
  async checkAccount(account: string) {
    await expect(this.account()).toHaveText(account);
  }

  async checkAmount(amount: string) {
    await expect(this.amount()).toHaveText(amount);
  }

  @Step("Check recipient details")
  async checkRecipient(recipient: string) {
    await scrollToId(this.recipientId);
    await expect(getElementById(this.recipientId)).toHaveText(recipient);
  }
}
