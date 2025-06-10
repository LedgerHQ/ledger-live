import { verifyAppValidationSendInfo } from "../../models/send";
import { device } from "detox";
import { TransactionType } from "@ledgerhq/live-common/e2e/models/Transaction";
import { AccountType, getParentAccountName } from "@ledgerhq/live-common/e2e/enum/Account";
import { getEnv } from "@ledgerhq/live-env";
import { TransactionStatus } from "@ledgerhq/live-common/e2e/enum/TransactionStatus";
import invariant from "invariant";

async function navigateToSubAccount(account: AccountType) {
  await app.account.openViaDeeplink();
  await app.account.goToAccountByName(getParentAccountName(account));
  await app.account.navigateToTokenInAccount(account);
}

async function checkOperationInfos(
  transaction: TransactionType,
  operationType?: keyof typeof app.operationDetails.operationsType,
) {
  await app.operationDetails.waitForOperationDetails();
  await app.operationDetails.checkAccount(transaction.accountToDebit.currency.name);
  await app.operationDetails.checkRecipientAddress(transaction.accountToCredit);
  if (operationType) await app.operationDetails.checkTransactionType(operationType);
}

const beforeAllFunction = async (transaction: TransactionType, setAccountToCredit: boolean) => {
  await app.init({
    userdata: "skip-onboarding",
    speculosApp: transaction.accountToDebit.currency.speculosApp,
    cliCommands: [
      (userDataPath?: string) => {
        return CLI.liveData({
          currency: transaction.accountToDebit.currency.speculosApp.name,
          index: transaction.accountToDebit.index,
          appjson: userDataPath,
          add: true,
        });
      },
      ...(setAccountToCredit
        ? [
            (userDataPath?: string) => {
              return CLI.liveData({
                currency: transaction.accountToCredit.currency.speculosApp.name,
                index: transaction.accountToCredit.index,
                appjson: userDataPath,
                add: true,
              });
            },
          ]
        : []),
    ],
  });

  await app.portfolio.waitForPortfolioPageToLoad();
};

export function runSendSPL(transaction: TransactionType, tmsLinks: string[]) {
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  describe("Send SPL tokens from 1 account to another", () => {
    beforeAll(async () => {
      await beforeAllFunction(transaction, true);
    });

    it(`Send from ${transaction.accountToDebit.accountName} Account to ${transaction.accountToCredit.accountName} Account - ${transaction.accountToDebit.currency.name} - E2E test`, async () => {
      const addressToCredit = transaction.accountToCredit.address;
      await navigateToSubAccount(transaction.accountToDebit);
      await app.account.tapSend();
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

      await checkOperationInfos(transaction, "OUT");

      if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
        const subAccountId = app.account.subAccountId(transaction.accountToCredit);
        await navigateToSubAccount(transaction.accountToCredit);
        await app.account.expectAccountBalanceVisible(subAccountId);
        await app.account.scrollToHistoryAndClickOnLastOperation(TransactionStatus.RECEIVED);
        await checkOperationInfos(transaction);
      }
    });
  });
}

export function runSendSPLAddressValid(
  transaction: TransactionType,
  expectedWarningMessage: string,
  tmsLinks: string[],
) {
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  describe("Send token - valid address input", () => {
    beforeAll(async () => {
      await beforeAllFunction(transaction, false);
    });

    it(`Send from ${transaction.accountToDebit.accountName} to ${transaction.accountToCredit.accountName} - ${transaction.accountToDebit.currency.name} - valid address input`, async () => {
      await app.send.openViaDeeplink();
      await app.common.performSearch(transaction.accountToDebit.currency.ticker);
      await app.common.selectAccount(transaction.accountToDebit);
      const addressToCredit = transaction.accountToCredit.address || "";
      await app.send.setRecipient(addressToCredit, transaction.memoTag);
      await app.send.expectSendRecipientWarning(expectedWarningMessage);
    });
  });
}

export function runSendSPLAddressInvalid(
  transaction: TransactionType,
  recipientContractAddress: string | undefined,
  expectedErrorMessage: string,
  tmsLinks: string[],
) {
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  describe("Send token - invalid address input", () => {
    beforeAll(async () => {
      await beforeAllFunction(transaction, false);
    });

    it(`Send from ${transaction.accountToDebit.accountName} to ${transaction.accountToCredit.accountName} - ${transaction.accountToCredit.currency.name} - ${expectedErrorMessage}`, async () => {
      await app.send.openViaDeeplink();
      await app.common.performSearch(transaction.accountToDebit.currency.ticker);
      await app.common.selectAccount(transaction.accountToDebit);
      invariant(recipientContractAddress, "Recipient address is not defined");
      await app.send.setRecipient(recipientContractAddress, transaction.memoTag);
      await app.send.expectSendRecipientError(expectedErrorMessage);
    });
  });
}
