import { Step } from "jest-allure2-reporter/api";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { TransactionType } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { byId } from "@e2e/helpers/elements/native";

export default class OperationDetailsPage {
  private readonly title = byId("operationDetails-title");
  private readonly recipient = byId("operationDetails-recipient0");
  private readonly delegatedAmount = byId("operationDetails-delegatedAmount");
  private readonly provider = byId("operationDetails-delegatedTo");
  private readonly sender = byId("operationDetails-sender0");
  private readonly fees = byId("operationDetails-fees");
  "operationsType" = {
    OUT: "Sent",
    DELEGATE: "Delegated",
    REDELEGATE: "Redelegated",
    UNDELEGATE: "Undelegated",
    STAKE: "Staked",
    UNSTAKE: "Unstaked",
    LOCK: "Locked",
    VOTE: "Voted",
  };
  private readonly account = byId("operationDetails-account");
  private readonly amount = byId("operationDetails-amount");
  private readonly identifier = byId("operationDetails-identifier");
  private readonly date = byId("operationDetails-date");
  private readonly scrollView = byId("operation-details-scroll-view");
  private readonly celoValidatorGroup = byId("celo-operationDetails-validatorGroup");
  private readonly viewInExplorerButton = byId("operation-detail-view-in-explorer-button");

  @Step("Wait for operation details")
  async waitForOperationDetails() {
    await this.title.waitVisible();
  }

  @Step("Check account details {{{0}}}")
  async checkAccount(account: string) {
    await this.account.expectText(account);
  }

  @Step("Check recipient details {{{0.accountName}}}")
  async checkRecipientAddress(recipient: Account) {
    await this.recipient.scrollTo(this.scrollView);

    const expected = recipient.address;
    if (expected) {
      await this.recipient.expectText(expected);
    } else {
      throw new Error("Recipient address is undefined");
    }
  }

  @Step("Check recipient as provider {{{0}}}")
  async checkRecipientAsProvider(recipientAddress: string) {
    await this.recipient.scrollTo(this.scrollView);
    await this.recipient.expectText(recipientAddress);
  }

  @Step("Check delegated provider {{{0}}}")
  async checkProvider(provider: string) {
    await this.provider.scrollTo(this.scrollView);
    await this.provider.expectText(provider);
  }

  @Step("Check delegated amount {{{0}}}")
  async checkDelegatedAmount(amount: string) {
    await this.delegatedAmount.scrollTo(this.scrollView);
    await this.delegatedAmount.expectText(amount);
  }

  @Step("Check sender {{{0}}}")
  async checkSender(sender: string) {
    await this.sender.scrollTo(this.scrollView);
    await this.sender.expectText(sender);
  }

  @Step("Check Fees {{{0}}}")
  async checkFees(fees: string) {
    await this.fees.scrollTo(this.scrollView);
    await this.fees.expectText(fees);
  }

  @Step("Check transaction type {{{0}}}")
  async checkTransactionType(type: keyof typeof this.operationsType) {
    await this.title.expectText(this.operationsType[type]);
  }

  @Step("Check transaction title {{{0}}}")
  async checkTransactionTitle(title: string) {
    await this.title.expectText(title);
  }

  @Step("Check CELO validator group in operation details {{{0}}}")
  async checkCeloValidatorGroup(validatorGroup: string) {
    await this.celoValidatorGroup.scrollTo(this.scrollView);
    await this.celoValidatorGroup.expectText(validatorGroup);
  }

  @Step("Check operation infos")
  async checkOperationInfos(
    transaction: TransactionType,
    isSentTransaction: boolean = true,
    operationType?: keyof typeof this.operationsType,
  ) {
    await this.waitForOperationDetails();
    await this.checkAccount(transaction.accountToDebit.currency.name);
    await this.checkRecipientAddress(
      isSentTransaction ? transaction.accountToCredit : transaction.accountToCredit.parentAccount!,
    );
    if (operationType) await this.checkTransactionType(operationType);
  }

  @Step("Check that transaction details are displayed {{{0}}}")
  async checkTransactionDetailsVisibility(accountName?: string) {
    await this.waitForOperationDetails();
    await this.account.expectVisible();
    if (accountName) {
      await this.account.expectText(accountName);
    }
    await this.amount.expectVisible();
    await this.identifier.scrollTo(this.scrollView);
    await this.identifier.expectVisible();
    await this.date.expectVisible();
  }

  @Step("Expect operation amount ticker {{{0}}}")
  async expectOperationAmountTicker(ticker: string) {
    await this.waitForOperationDetails();
    const amountText = await this.amount.getText();
    jestExpect(amountText).toContain(ticker);
  }

  @Step("Check view in explorer button")
  async checkViewInExplorerButtonVisible() {
    await this.viewInExplorerButton.scrollTo(this.scrollView);
    await this.viewInExplorerButton.expectVisible();
  }
}
