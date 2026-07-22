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
  describe("New Send Flow - Native Send", () => {
    beforeAll(async () => {
      await beforeAllFunction(transaction, options);
    });

    it(`Send ${transaction.amount} ${transaction.accountToDebit.currency.ticker} from ${transaction.accountToDebit.accountName} to ${transaction.accountToCredit.accountName}`, async () => {
      await app.send.navigateToSendScreen(transaction.accountToDebit.accountName);
      await app.send.setRecipientAndContinueNewFlow(
        transaction.accountToCredit.address,
        transaction.memoTag,
      );
      await app.send.setAmountAndReviewNewFlow(transaction.amount);
      await app.send.waitForSignature();
      await app.speculos.signSendTransaction(transaction);
      await app.send.waitForSuccessConfirmation();
      await app.operationDetails.waitForOperationDetails();
      await app.operationDetails.checkAccount(transaction.accountToDebit.accountName);
      await app.operationDetails.checkRecipientAddress(transaction.accountToCredit);
      await app.operationDetails.checkTransactionType("OUT");
    });
  });
}
