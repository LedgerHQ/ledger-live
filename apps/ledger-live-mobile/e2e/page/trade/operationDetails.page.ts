export default class OperationDetailsPage {
  titleId = "operationDetails-title";
  title = () => getElementById(this.titleId);
  account = () => getElementById("operationDetails-account");
  amount = () => getElementById("operationDetails-amount");
  recipientId = "operationDetails-recipient0";
  delegatedAmountId = "operationDetails-delegatedAmount";
  providerId = "operationDetails-delegatedTo";
  senderId = "operationDetails-sender0";
  feesId = "operationDetails-fees";

  "operationsType" = {
    OUT: "Sent",
    DELEGATE: "Delegated",
    STAKE: "Staked",
    LOCK: "Locked",
  };

  async isOpened() {
    await detoxExpect(this.title()).toBeVisible();
  }

  @Step("Wait for operation details")
  async waitForOperationDetails() {
    await waitForElementById(this.titleId);
  }

  @Step("Check account details")
  async checkAccount(account: string) {
    await detoxExpect(this.account()).toHaveText(account);
  }

  async checkAmount(amount: string) {
    await detoxExpect(this.amount()).toHaveText(amount);
  }

  @Step("Check recipient details")
  async checkRecipient(recipient: string) {
    await scrollToId(this.recipientId);
    await detoxExpect(getElementById(this.recipientId)).toHaveText(recipient);
  }

  @Step("Check delegated provider")
  async checkProvider(provider: string) {
    await scrollToId(this.providerId);
    await detoxExpect(getElementById(this.providerId)).toHaveText(provider);
  }

  @Step("Check delegated amount")
  async checkDelegatedAmount(amount: string) {
    await scrollToId(this.delegatedAmountId);
    await detoxExpect(getElementById(this.delegatedAmountId)).toHaveText(amount);
  }

  @Step("Check sender")
  async checkSender(sender: string) {
    await scrollToId(this.senderId);
    await detoxExpect(getElementById(this.senderId)).toHaveText(sender);
  }

  @Step("Check Fees")
  async checkFees(fees: string) {
    await scrollToId(this.feesId);
    await detoxExpect(getElementById(this.feesId)).toHaveText(fees);
  }

  @Step("Check transaction type")
  async checkTransactionType(type: keyof typeof this.operationsType) {
    await detoxExpect(getElementById(this.titleId)).toHaveText(this.operationsType[type]);
  }
}
