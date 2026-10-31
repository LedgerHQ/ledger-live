import { Transaction, TransactionType } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { coinTeamOwner } from "@ledgerhq/live-e2e-shared/data/coinTeamOwner";
import { SendScenario, sendFolder } from "@ledgerhq/live-e2e-shared/enum/TestFolder";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { declareBroadcastAccounts } from "@e2e/helpers/exclusiveLock";
import { beforeAllFunction, SendTestOptions } from "@e2e/specs/send/send";

const beforeAllTokenFunction = async (transaction: TransactionType, options?: SendTestOptions) => {
  await app.init({
    speculosApp: transaction.accountToDebit.currency.speculosApp,
    ...(options?.userdata !== undefined ? { userdata: options.userdata } : {}),
    featureFlags: {
      ...options?.featureFlags,
    },
    cliCommands: [
      async (userdataPath?: string) => {
        await liveDataWithAddressCommand(
          transaction.accountToDebit,
          options?.liveDataOptions,
        )(userdataPath);
        transaction.accountToCredit.address = await getAccountAddress(transaction.accountToCredit);
        transaction.recipientAddress = transaction.accountToCredit.address;
      },
    ],
  });

  await app.mainNavigation.waitForWallet40Ready();
};

export function runNewSendFlowTokenTest(
  transaction: TransactionType,
  tmsLinks: string[],
  tags: string[],
  options?: SendTestOptions,
) {
  declareBroadcastAccounts(transaction.accountToDebit);
  setTeamOwner(coinTeamOwner(transaction.accountToDebit.currency.id), {
    folder: sendFolder(transaction.accountToDebit),
    scenario: SendScenario.TRANSACTION,
  });
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("New Send Flow - Token Send", () => {
    beforeAll(async () => {
      await beforeAllTokenFunction(transaction, options);
    });

    it(`[${transaction.accountToDebit.currency.testLabel}] - Send`, async () => {
      await app.newSend.navigateToTokenSendScreen(
        transaction.accountToDebit.parentAccount!.accountName,
        transaction.accountToDebit,
      );
      await app.newSend.setRecipientAndContinueNewFlow(
        transaction.accountToCredit.address,
        transaction.memoTag,
      );
      await app.newSend.setAmountAndReviewNewFlow(transaction.amount);
      await app.newSend.waitForSignature();
      await app.speculos.signSendTransaction(transaction);
      await app.newSend.tapViewTransaction();
      await app.operationDetails.waitForOperationDetails();
      await app.operationDetails.checkAccount(transaction.accountToDebit.currency.name);
      await app.operationDetails.checkRecipientAddress(transaction.accountToCredit);
      await app.operationDetails.checkTransactionType("OUT");
    });
  });
}

export function runNewSendFlowTest(
  transaction: TransactionType,
  tmsLinks: string[],
  tags: string[],
  options?: SendTestOptions,
) {
  declareBroadcastAccounts(transaction.accountToDebit);
  setTeamOwner(coinTeamOwner(transaction.accountToDebit.currency.id), {
    folder: sendFolder(transaction.accountToDebit),
    scenario: SendScenario.TRANSACTION,
  });
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Send - new flow", () => {
    beforeAll(async () => {
      await beforeAllFunction(transaction, options);
    });

    it(`[${transaction.accountToDebit.currency.testLabel}] - Send`, async () => {
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

export type NewSendMemoTestOptions = {
  /**
   * Non-numeric input used to assert numeric-only enforcement of the memo field. Only relevant for
   * numeric "tag" families (XRP): when provided, asserts the field rejects it while retaining the
   * transaction's numeric `memoTag`. Text-memo families (Stellar, Cosmos, Solana) omit it.
   */
  invalidMemoInput?: string;
  /**
   * Also broadcast a second transaction without a memo (skip path). Disable for families that
   * reject a new transaction while a previous one is still pending (e.g. Stellar).
   * @default true
   */
  broadcastWithoutMemo?: boolean;
  /**
   * Memo-type values expected in the memo-type dropdown (families with a memo-type selector, e.g.
   * Stellar: NO_MEMO, MEMO_TEXT, MEMO_ID, MEMO_HASH, MEMO_RETURN). When provided, asserts the
   * dropdown opens and shows these options.
   */
  memoTypeOptions?: string[];
};

/**
 * Memo coverage for the new send flow, one describe per test case (e.g. XRP = B2CQA-6037).
 * `transaction.memoTag` must be a valid memo for the family under test. Verifies:
 *  - numeric-only input enforcement when `invalidMemoInput` is provided (numeric "tag" families),
 *  - the memo-type dropdown shows the expected options when `memoTypeOptions` is provided,
 *  - the skip option bypasses the memo requirement,
 *  - the transaction completes successfully with a memo, and without a memo (skip) unless
 *    `broadcastWithoutMemo` is false.
 */
export function runNewSendMemoTest(
  transaction: TransactionType,
  tmsLinks: string[],
  tags: string[],
  options?: SendTestOptions,
  memoOptions: NewSendMemoTestOptions = {},
) {
  const { invalidMemoInput, broadcastWithoutMemo = true, memoTypeOptions } = memoOptions;
  declareBroadcastAccounts(transaction.accountToDebit);
  setTeamOwner(coinTeamOwner(transaction.accountToDebit.currency.id), {
    folder: sendFolder(transaction.accountToDebit),
    scenario: SendScenario.MEMO,
  });
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));

  const label = transaction.accountToDebit.currency.testLabel;
  // Same transaction but skipping the memo, so Speculos does not expect a memo on the device.
  const noMemoTransaction = new Transaction(
    transaction.accountToDebit,
    transaction.accountToCredit,
    transaction.amount,
    transaction.speed,
    "noTag",
  );

  describe("Send - new flow - Memo", () => {
    beforeAll(async () => {
      await beforeAllFunction(transaction, options);
    });

    if (invalidMemoInput !== undefined) {
      it(`[${label}] - Send - numeric memo only (${invalidMemoInput})`, async () => {
        await app.send.navigateToSendScreen(transaction.accountToDebit.accountName);
        await app.newSend.typeRecipientNewFlow(transaction.accountToCredit.address);
        await app.newSend.expectMemoRejectsNonNumericInput(invalidMemoInput);
        if (transaction.memoTag) {
          await app.newSend.expectMemoRetainsNumericInput(transaction.memoTag);
        }
      });
    }

    if (memoTypeOptions !== undefined) {
      it(`[${label}] - Send - memo type options`, async () => {
        await app.send.navigateToSendScreen(transaction.accountToDebit.accountName);
        await app.newSend.typeRecipientNewFlow(transaction.accountToCredit.address);
        await app.newSend.expectMemoTypeOptions(memoTypeOptions);
      });
    }

    it(`[${label}] - Send - with memo`, async () => {
      await app.send.navigateToSendScreen(transaction.accountToDebit.accountName);
      await app.newSend.setRecipientAndContinueNewFlow(
        transaction.accountToCredit.address,
        transaction.memoTag,
      );
      await app.newSend.setAmountAndReviewNewFlow(transaction.amount);
      await app.newSend.waitForSignature();
      // Speculos asserts the memo is displayed on the device review screen.
      await app.speculos.signSendTransaction(transaction);
      await app.newSend.tapViewTransaction();
      await app.operationDetails.waitForOperationDetails();
      await app.operationDetails.checkAccount(transaction.accountToDebit.accountName);
      await app.operationDetails.checkRecipientAddress(transaction.accountToCredit);
      await app.operationDetails.checkTransactionType("OUT");
    });

    if (broadcastWithoutMemo) {
      it(`[${label}] - Send - without memo`, async () => {
        await app.send.navigateToSendScreen(noMemoTransaction.accountToDebit.accountName);
        await app.newSend.setRecipientAndContinueNewFlow(
          noMemoTransaction.accountToCredit.address,
          noMemoTransaction.memoTag,
        );
        await app.newSend.setAmountAndReviewNewFlow(noMemoTransaction.amount);
        await app.newSend.waitForSignature();
        await app.speculos.signSendTransaction(noMemoTransaction);
        await app.newSend.tapViewTransaction();
        await app.operationDetails.waitForOperationDetails();
        await app.operationDetails.checkAccount(noMemoTransaction.accountToDebit.accountName);
        await app.operationDetails.checkRecipientAddress(noMemoTransaction.accountToCredit);
        await app.operationDetails.checkTransactionType("OUT");
      });
    }
  });
}
