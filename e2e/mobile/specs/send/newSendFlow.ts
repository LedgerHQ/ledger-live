import { TransactionType } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";
import { BST_SEND_CURRENCIES, beforeAllFunction, SendTestOptions } from "./send";

export function runNewSendFlowTest(
  transaction: TransactionType,
  tmsLinks: string[],
  tags: string[],
  options?: SendTestOptions,
) {
  setTeamOwner(
    BST_SEND_CURRENCIES.has(transaction.accountToDebit.currency.id)
      ? Team.BST
      : Team.COIN_INTEGRATION,
  );
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Send - new flow", () => {
    beforeAll(async () => {
      await beforeAllFunction(transaction, options);
    });

    it(`[${transaction.accountToDebit.currency.testLabel}] - Send (new send flow)`, async () => {
      await app.send.navigateToSendScreen(transaction.accountToDebit.accountName);
      await app.newSend.setRecipientAndContinueNewFlow(
        transaction.accountToCredit.address,
        transaction.memoTag,
      );
      await app.newSend.setAmountAndReviewNewFlow(transaction.amount);
      await app.newSend.waitForSignature();
      await app.speculos.signSendTransaction(transaction);
      await app.newSend.tapViewTransaction();
      await app.operationDetails.waitForOperationDetails();
      await app.operationDetails.checkAccount(transaction.accountToDebit.accountName);
      await app.operationDetails.checkRecipientAddress(transaction.accountToCredit);
      await app.operationDetails.checkTransactionType("OUT");
    });
  });
}
