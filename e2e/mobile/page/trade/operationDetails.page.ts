import { Step } from "jest-allure2-reporter/api";
import { Account } from "@ledgerhq/live-common/lib/e2e/enum/Account";

export default class OperationDetailsPage {
  titleId = "operationDetails-title";
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
  operationDetailsConfirmed = "operation-details-text-confirmed";
  operationDetailsAccount = "operationDetails-account";
  operationDetailsAmount = "operationDetails-amount";
  operationDetailsIdentifier = "operationDetails-identifier";
  operationDetailsDate = "operationDetails-date";
  operationDetailsScrollViewId = "operation-details-scroll-view";

  title = () => getElementById(this.titleId);
  account = () => getElementById(this.operationDetailsAccount);
  amount = () => getElementById(this.operationDetailsAmount);
  operation = () => getElementById(this.operationDetailsIdentifier);
  date = () => getElementById(this.operationDetailsDate);

  @Step("Wait for operation details")
  async waitForOperationDetails() {
    await waitForElementById(this.titleId);
  }

  @Step("Check account details")
  async checkAccount(account: string) {
    await detoxExpect(this.account()).toHaveText(account);
  }

  @Step("Check recipient details")
  async checkRecipientAddress(recipient: Account) {
    await scrollToId(this.recipientId, this.operationDetailsScrollViewId);
    const recipientElement = getElementById(this.recipientId);

    const expected = recipient.address;
    if (expected) {
      await detoxExpect(recipientElement).toHaveText(expected);
    } else {
      throw new Error("Recipient address is undefined");
    }
  }

  @Step("Check recipient as provider")
  async checkRecipientAsProvider(recipientAddress: string) {
    await scrollToId(this.recipientId, this.operationDetailsScrollViewId);
    const recipientElement = getElementById(this.recipientId);
    await detoxExpect(recipientElement).toHaveText(recipientAddress);
  }

  @Step("Check delegated provider")
  async checkProvider(provider: string) {
    await scrollToId(this.providerId, this.operationDetailsScrollViewId);
    await detoxExpect(getElementById(this.providerId)).toHaveText(provider);
  }

  @Step("Check delegated amount")
  async checkDelegatedAmount(amount: string) {
    await scrollToId(this.delegatedAmountId, this.operationDetailsScrollViewId);
    await detoxExpect(getElementById(this.delegatedAmountId)).toHaveText(amount);
  }

  @Step("Check sender")
  async checkSender(sender: string) {
    await scrollToId(this.senderId, this.operationDetailsScrollViewId);
    await detoxExpect(getElementById(this.senderId)).toHaveText(sender);
  }

  @Step("Check Fees")
  async checkFees(fees: string) {
    await scrollToId(this.feesId, this.operationDetailsScrollViewId);
    await detoxExpect(getElementById(this.feesId)).toHaveText(fees);
  }

  @Step("Check transaction type")
  async checkTransactionType(type: keyof typeof this.operationsType) {
    await detoxExpect(getElementById(this.titleId)).toHaveText(this.operationsType[type]);
  }

  @Step("Check that transaction details are displayed")
  async checkTransactionDetailsVisibility(currencyName: string) {
    await this.waitForOperationDetails();
    await detoxExpect(this.account()).toBeVisible();
    await detoxExpect(this.account()).toHaveText(currencyName + " 1");
    await detoxExpect(this.amount()).toBeVisible();
    await scrollToId(this.operationDetailsIdentifier, this.operationDetailsScrollViewId);
    await detoxExpect(this.operation()).toBeVisible();
    await detoxExpect(this.date()).toBeVisible();
  }
}
