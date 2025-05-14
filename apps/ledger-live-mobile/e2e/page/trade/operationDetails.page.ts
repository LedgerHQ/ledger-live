import { expect } from "detox";

export default class OperationDetailsPage {
  titleId = "operationDetails-title";
  title = () => getElementById(this.titleId);
  account = () => getElementById("operationDetails-account");
  amount = () => getElementById("operationDetails-amount");
  delegatedAmountId = "operationDetails-delegatedAmount";
  providerId = "operationDetails-delegatedTo";
  senderId = "operationDetails-sender0";
  feesId = "operationDetails-fees";

  async isOpened() {
    await expect(this.title()).toBeVisible();
  }

  @Step("Check account details")
  async checkAccount(account: string) {
    await expect(this.account()).toHaveText(account);
  }

  async checkAmount(amount: string) {
    await expect(this.amount()).toHaveText(amount);
  }

  @Step("Check delegated provider")
  async checkProvider(provider: string) {
    await scrollToId(this.providerId);
    await expect(getElementById(this.providerId)).toHaveText(provider);
  }

  @Step("Check delegated amount")
  async checkDelegatedAmount(amount: string) {
    await scrollToId(this.delegatedAmountId);
    await expect(getElementById(this.delegatedAmountId)).toHaveText(amount);
  }

  @Step("Check sender")
  async checkSender(sender: string) {
    await scrollToId(this.senderId);
    await expect(getElementById(this.senderId)).toHaveText(sender);
  }

  @Step("Check Fees")
  async checkFees(fees: string) {
    await scrollToId(this.feesId);
    await expect(getElementById(this.feesId)).toHaveText(fees);
  }
}
