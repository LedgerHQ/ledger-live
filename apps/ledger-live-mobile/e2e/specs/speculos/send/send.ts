import { verifyAppValidationSendInfo } from "../../../models/send";
import { Application } from "../../../page";
import { CLI } from "../../../utils/cliUtils";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { device } from "detox";

export async function runSendTest(transaction: Transaction, tmsLink: string) {
  const app = new Application();

  $TmsLink(tmsLink);
  describe(`Send flow on  ${transaction.accountToCredit.currency.name}`, () => {
    beforeAll(async () => {
      await app.init({
        speculosApp: transaction.accountToCredit.currency.speculosApp,
        cliCommands: [
          () => {
            return CLI.liveData({
              currency: transaction.accountToCredit.currency.currencyId,
              index: transaction.accountToCredit.index,
              add: true,
              appjson: app.userdataPath,
            });
          },
          () => {
            return CLI.liveData({
              currency: transaction.accountToDebit.currency.currencyId,
              index: transaction.accountToDebit.index,
              add: true,
              appjson: app.userdataPath,
            });
          },
        ],
      });

      await app.portfolio.waitForPortfolioPageToLoad();
    });

    it(`Send from 1 account to another on ${transaction.accountToCredit.currency.name}`, async () => {
      await app.accounts.openViaDeeplink();
      await app.common.goToAccountByName(transaction.accountToDebit.accountName);
      await app.account.tapSend();

      const amountWithCode = transaction.amount + " " + transaction.accountToCredit.currency.ticker;

      await app.send.setRecipientAndContinue(transaction.accountToCredit.address);
      await app.send.setAmountAndContinue(transaction.amount);

      await app.send.expectSummaryAmount(amountWithCode);
      await app.send.expectSummaryRecepient(transaction.accountToCredit.address);
      await app.send.summaryContinue();
      await app.send.dismissHighFeeModal();

      await verifyAppValidationSendInfo(app, transaction, amountWithCode);

      await app.speculos.signSendTransaction(transaction);

      await device.disableSynchronization();
      await app.common.successViewDetails();

      await app.operationDetails.waitForOperationDetails();
      await app.operationDetails.checkAccount(transaction.accountToDebit.accountName);
      await app.operationDetails.checkRecipient(transaction.accountToCredit.address);
      await app.operationDetails.checkTransactionType("OUT");
    });
  });
}
