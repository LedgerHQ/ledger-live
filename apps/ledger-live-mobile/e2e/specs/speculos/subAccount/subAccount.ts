import { verifyAppValidationSendInfo } from "../../../models/send";
import { device } from "detox";
import { TransactionType } from "@ledgerhq/live-common/e2e/models/Transaction";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

async function navigateToSendScreen(account: Account) {
  await app.accounts.openViaDeeplink();
  await app.account.openViaDeeplink();
  await app.account.navigateToTokenInAccount(account);
  await app.account.tapSend();
}

const beforeAllFunction = async (transaction: TransactionType) => {
  await app.init({
    userdata: "skip-onboarding",
    speculosApp: transaction.accountToCredit.currency.speculosApp,
    featureFlags: {
      llmAccountListUI: { enabled: true },
      llmNetworkBasedAddAccountFlow: { enabled: true },
    },
    cliCommands: [
      (userDataPath?: string) => {
        return CLI.liveData({
          currency: transaction.accountToCredit.currency.speculosApp.name,
          index: transaction.accountToCredit.index,
          appjson: userDataPath,
          add: true,
        });
      },
      (userDataPath?: string) => {
        return CLI.liveData({
          currency: transaction.accountToDebit.currency.speculosApp.name,
          index: transaction.accountToDebit.index,
          appjson: userDataPath,
          add: true,
        });
      },
    ],
  });

  await app.portfolio.waitForPortfolioPageToLoad();
};

export async function runSendSPL(transaction: TransactionType, tmsLinks: string[]) {
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  describe("Send SPL tokens from 1 account to another", () => {
    beforeAll(async () => {
      await beforeAllFunction(transaction);
    });
    it(`Send from ${transaction.accountToDebit.accountName} to ${transaction.accountToCredit.accountName} - ${transaction.accountToDebit.currency.name} - E2E test`, async () => {
      const addressToCredit = transaction.accountToCredit.address;
      await navigateToSendScreen(transaction.accountToDebit);
      await app.send.setRecipientAndContinue(addressToCredit, transaction.memoTag);
      await app.send.setAmountAndContinue(transaction.amount);

      const amountWithCode = transaction.amount + " " + transaction.accountToCredit.currency.ticker;
      await app.send.expectSummaryAmount(amountWithCode);
      await app.send.expectSummaryRecipient(addressToCredit);
      await app.send.expectSummaryMemoTag(transaction.memoTag);
      await app.send.chooseFeeStrategy(transaction.speed);
      await app.send.summaryContinue();
      await app.send.dismissHighFeeModal();

      await verifyAppValidationSendInfo(transaction, amountWithCode);

      await app.speculos.signSendTransaction(transaction);

      await device.disableSynchronization();
      await app.common.successViewDetails();

      await app.operationDetails.waitForOperationDetails();
      await app.operationDetails.checkAccount(transaction.accountToDebit.accountName);
      await app.operationDetails.checkRecipient(addressToCredit);
      await app.operationDetails.checkTransactionType("OUT");
    });
  });
}
