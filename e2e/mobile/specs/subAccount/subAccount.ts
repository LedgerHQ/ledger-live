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
            async (userDataPath?: string) => {
              await CLI.liveData({
                currency: transaction.accountToCredit.currency.speculosApp.name,
                index: transaction.accountToCredit.index,
                appjson: userDataPath,
                add: true,
              });

              const parentAccount = transaction.accountToCredit.parentAccount;
              invariant(parentAccount, "Parent account is required");

              const { address } = await CLI.getAddress({
                currency: parentAccount.currency.id,
                path: parentAccount.accountPath,
                derivationMode: parentAccount.derivationMode,
              });

              transaction.accountToCredit.address = address;

              return address;
            },
          ]
        : []),
    ],
  });

  await app.portfolio.waitForPortfolioPageToLoad();
};

export function runSendSPL(transaction: TransactionType, tmsLinks: string[], tags: string[]) {
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
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
  tags: string[],
) {
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Send token - valid address input", () => {
    beforeAll(async () => {
      await beforeAllFunction(transaction, false);
    });

    it(`Send from ${transaction.accountToDebit.accountName} to ${transaction.accountToCredit.accountName} - ${transaction.accountToDebit.currency.name} - valid address input`, async () => {
      await app.send.openViaDeeplink();
      await app.common.performSearch(transaction.accountToDebit.currency.ticker);
      await app.common.selectAccount(transaction.accountToDebit);
      const addressToCredit = "8nnwXo313DXWcE3kBR54gDKDmcySeGVjYRztbCAPzxev";
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
  tags: string[],
) {
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
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

export function runAddSubAccountTest(
  asset: AccountType,
  tmslinks: string[],
  tags: string[],
  withParentAccount: boolean,
) {
  describe(
    withParentAccount ? "Add subAccount when parent exists" : "Add subAccount without parent",
    () => {
      beforeAll(async () => {
        await app.init({
          userdata: withParentAccount ? "speculos-subAccount" : "skip-onboarding",
          speculosApp: asset.currency.speculosApp,
        });
        await app.portfolio.waitForPortfolioPageToLoad();
      });

      tmslinks.forEach(tmsLink => $TmsLink(tmsLink));
      tags.forEach(tag => $Tag(tag));
      it(
        withParentAccount
          ? `[${asset.currency.speculosApp.name}] Add subAccount when parent exists (${asset.currency.ticker})`
          : `Add Sub Account without parent (${asset.currency.speculosApp.name}) - ${asset.currency.ticker}`,
        async () => {
          if (withParentAccount) {
            await app.portfolio.tapTabSelector("Accounts");
            await app.portfolio.tapAddNewOrExistingAccountButton();
          } else {
            await app.portfolio.addAccount();
          }

          const isModularDrawer = await app.modularDrawer.isFlowEnabled("add_account");

          if (isModularDrawer) {
            await app.addAccount.importWithYourLedger();
            await app.modularDrawer.performSearchByTicker(asset.currency.ticker);
            await app.modularDrawer.selectCurrencyByTicker(asset.currency.ticker);
            const networkName =
              asset?.parentAccount === undefined
                ? asset.currency.speculosApp.name
                : asset?.parentAccount?.currency.name;
            await app.modularDrawer.selectNetworkIfAsked(networkName);
          } else {
            await app.addAccount.importWithYourLedger();
            await app.common.performSearch(
              asset?.parentAccount === undefined ? asset.currency.id : asset.currency.name,
            );
            if (asset.tokenType) {
              await app.receive.selectCurrencyByType(asset.tokenType);
            } else {
              await app.receive.selectCurrency(asset.currency.id);
            }
            const networkId =
              asset?.parentAccount === undefined
                ? asset.currency.speculosApp.name.toLowerCase()
                : asset?.parentAccount?.currency.id;
            await app.receive.selectNetworkIfAsked(networkId);
          }

          const accountId = await app.addAccount.addAccountAtIndex(
            asset?.parentAccount === undefined
              ? asset.accountName
              : asset.parentAccount.accountName,
            asset?.parentAccount === undefined
              ? `${asset.currency.id}:${asset.address}`
              : asset.parentAccount.currency.id,
            asset.index,
          );

          await app.common.goToAccount(accountId);
          await app.account.expectAccountBalanceVisible(accountId);
          await app.account.expectOperationHistoryVisible(accountId);
          await app.account.expectAddressIndex(0);
        },
      );
    },
  );
}
