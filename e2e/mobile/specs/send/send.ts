import { setEnv } from "@shared/env";
import { verifyAppValidationSendInfo } from "@e2e/models/send";

import invariant from "invariant";
import { TransactionType } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { coinTeamOwner } from "@ledgerhq/live-e2e-shared/data/coinTeamOwner";
import { TestFolder } from "@ledgerhq/live-e2e-shared/enum/TestFolder";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { BroadcastFlow, shouldRunSharedAccountFlow } from "@e2e/helpers/broadcastRotation";
import { declareBroadcastAccounts } from "@e2e/helpers/exclusiveLock";
import type { LiveDataCommandOptions } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import type { InitOptions } from "@e2e/utils/initUtil";
import type { TestMetaOptions } from "@e2e/models/testOptions";
import { FF_DISABLE_NEW_SEND_FLOW } from "@e2e/utils/featureFlagUtils";
import { describeIfNanoSSupports, describeIfNotNanoS } from "@e2e/helpers/commonHelpers";

export type SendTestOptions = {
  featureFlags?: InitOptions["featureFlags"];
  userdata?: InitOptions["userdata"];
  liveDataOptions?: LiveDataCommandOptions;
  /**
   * Set it when the debited account is shared with the other mobile platform: the send then runs
   * on one platform per run once both broadcast, instead of racing the account's nonce.
   */
  sharedAccountFlow?: BroadcastFlow;
  /** Skips the send on LNS even though its currency is supported there. */
  skipLNS?: boolean;
};

export const beforeAllFunction = async (
  transaction: TransactionType,
  options?: SendTestOptions,
) => {
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

export const beforeAllLegacyFunction = async (
  transaction: TransactionType,
  options?: SendTestOptions,
) => {
  await beforeAllFunction(transaction, {
    ...options,
    featureFlags: { ...options?.featureFlags, ...FF_DISABLE_NEW_SEND_FLOW },
  });
};

const beforeAllInvalidAddressFunction = async (
  transaction: TransactionType,
  overrideRecipient?: string,
) => {
  await app.init({
    speculosApp: transaction.accountToDebit.currency.speculosApp,
    featureFlags: FF_DISABLE_NEW_SEND_FLOW,
    cliCommands: [
      async (userdataPath?: string) => {
        await liveDataCommand(transaction.accountToDebit)(userdataPath);

        if (transaction.accountToCredit.accountName !== Account.BTC_NATIVE_SEGWIT_1.accountName) {
          transaction.accountToCredit.address = await getAccountAddress(
            transaction.accountToCredit,
          );
        }

        if (overrideRecipient !== undefined) {
          transaction.accountToCredit.address = overrideRecipient;
          return overrideRecipient;
        }

        return transaction.accountToCredit.address;
      },
    ],
  });

  await app.mainNavigation.waitForWallet40Ready();
};

export async function verifySendAndOperationDetails(
  transaction: TransactionType,
  amountWithCode: string,
) {
  await app.send.expectSummaryAmount(amountWithCode);
  await app.send.expectSummaryRecipient(transaction.accountToCredit.address);
  await app.send.expectSummaryMemoTag(transaction.memoTag);
  await app.send.chooseFeeStrategy(transaction.speed);
  await app.send.summaryContinue();
  await app.send.dismissHighFeeModal();

  await verifyAppValidationSendInfo(transaction, amountWithCode);

  await app.speculos.signSendTransaction(transaction);
  await app.common.successViewDetails();

  await app.operationDetails.waitForOperationDetails();
  await app.operationDetails.checkAccount(transaction.accountToDebit.accountName);
  await app.operationDetails.checkRecipientAddress(transaction.accountToCredit);
  await app.operationDetails.checkTransactionType("OUT");
}

export type RunSendTestBaseOptions = TestMetaOptions & {
  transaction: TransactionType;
};

type RunSendTestOptions = SendTestOptions & RunSendTestBaseOptions;

export function runSendTest(options: RunSendTestOptions) {
  const { transaction, tmsLinks, tags, ...sendOptions } = options;
  declareBroadcastAccounts(transaction.accountToDebit);
  setTeamOwner(coinTeamOwner(transaction.accountToDebit.currency.id), {
    folder: TestFolder.LEGACY_TESTS,
  });
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  const flow = sendOptions.sharedAccountFlow;
  const describeOnDevice = sendOptions.skipLNS
    ? describeIfNotNanoS
    : describeIfNanoSSupports(transaction.accountToDebit.currency.id);
  const describeFlow =
    flow === undefined || shouldRunSharedAccountFlow(flow) ? describeOnDevice : describe.skip;
  describeFlow("Send from 1 account to another", () => {
    beforeAll(async () => {
      await beforeAllLegacyFunction(transaction, sendOptions);
    });

    it(`[${transaction.accountToDebit.currency.testLabel}] - Send`, async () => {
      const addressToCredit = transaction.accountToCredit.address;
      const amountWithCode = transaction.amount + " " + transaction.accountToCredit.currency.ticker;
      await app.send.navigateToSendScreen(transaction.accountToDebit);
      await app.send.setRecipientAndContinue({
        address: addressToCredit,
        memoTag: transaction.memoTag,
      });
      await app.send.setAmountAndContinue(transaction.amount);
      await verifySendAndOperationDetails(transaction, amountWithCode);
    });
  });
}

type RunSendInvalidAddressTestOptions = RunSendTestBaseOptions & {
  expectedErrorMessage: string;
  /** What the invalid recipient is, for the test name: e.g. "incorrect format". */
  scenario: string;
  address?: string;
  accountName?: string;
};

export function runSendInvalidAddressTest(options: RunSendInvalidAddressTestOptions) {
  const { transaction, expectedErrorMessage, scenario, address, tmsLinks, tags, accountName } =
    options;
  setTeamOwner(coinTeamOwner(transaction.accountToDebit.currency.id), {
    folder: TestFolder.LEGACY_TESTS,
  });
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  const describeOnDevice = describeIfNanoSSupports(transaction.accountToDebit.currency.id);
  describeOnDevice("Send - invalid address input", () => {
    beforeAll(async () => {
      await beforeAllInvalidAddressFunction(transaction, address);
    });

    it(`[${transaction.accountToDebit.currency.testLabel}] - Send - invalid address - ${scenario}`, async () => {
      const recipientAddress = address ?? transaction.accountToCredit.address ?? "";
      await app.send.navigateToSendScreen(transaction.accountToDebit, accountName);
      await app.send.setRecipient({ address: recipientAddress, memoTag: transaction.memoTag });
      await app.send.expectSendRecipientError(expectedErrorMessage);
    });
  });
}

type RunSendValidAddressTestOptions = RunSendTestBaseOptions & {
  /** What the valid recipient is, for the test name: e.g. "with tag". */
  scenario: string;
  accountName?: string;
};

export function runSendValidAddressTest(options: RunSendValidAddressTestOptions) {
  const { transaction, tmsLinks, scenario, tags, accountName } = options;
  setTeamOwner(coinTeamOwner(transaction.accountToDebit.currency.id), {
    folder: TestFolder.LEGACY_TESTS,
  });
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Send - valid address input", () => {
    beforeAll(async () => {
      await beforeAllLegacyFunction(transaction, { liveDataOptions: { useScheme: true } });
    });

    it(`[${transaction.accountToDebit.currency.testLabel}] - Send - valid address - ${scenario}`, async () => {
      await app.send.navigateToSendScreen(transaction.accountToDebit, accountName);
      const recipientAddress = transaction.accountToCredit.address ?? "";
      await app.send.setRecipient({ address: recipientAddress, memoTag: transaction.memoTag });
      await app.send.expectSendRecipientSuccess();
      await app.send.recipientContinue(transaction.memoTag);
      await app.send.setAmountAndContinue(transaction.amount);

      const amountWithCode = transaction.amount + " " + transaction.accountToCredit.currency.ticker;
      await app.send.expectSummaryAmount(amountWithCode);
      await app.send.expectSummaryRecipient(transaction.accountToCredit.address);
      await app.send.expectSummaryMemoTag(transaction.memoTag);
    });
  });
}

type RunSendInvalidAmountTestOptions = RunSendTestBaseOptions & {
  expectedErrorMessage: string;
};

export function runSendInvalidAmountTest(options: RunSendInvalidAmountTestOptions) {
  const { transaction, expectedErrorMessage, tmsLinks, tags } = options;
  setTeamOwner(coinTeamOwner(transaction.accountToDebit.currency.id), {
    folder: TestFolder.LEGACY_TESTS,
  });
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  const describeOnDevice = describeIfNanoSSupports(transaction.accountToDebit.currency.id);
  describeOnDevice("Send - invalid amount input", () => {
    beforeAll(async () => {
      await beforeAllLegacyFunction(transaction);
    });

    it(`[${transaction.accountToDebit.currency.testLabel}] - Send - invalid amount (${transaction.amount})`, async () => {
      await app.send.navigateToSendScreen(transaction.accountToDebit);
      await app.send.setRecipientAndContinue({
        address: transaction.accountToCredit.address,
        memoTag: transaction.memoTag,
      });
      await app.send.setAmount(transaction.amount);
      await app.send.expectSendAmountError(expectedErrorMessage);
    });
  });
}

type RunSendInvalidTokenAmountTestOptions = RunSendTestBaseOptions & {
  /** A RegExp is a summary-step error; a string is an amount-step error. */
  expectedErrorMessage: RegExp | string;
};

export function runSendInvalidTokenAmountTest(options: RunSendInvalidTokenAmountTestOptions) {
  const { transaction, expectedErrorMessage, tmsLinks, tags } = options;
  setTeamOwner(coinTeamOwner(transaction.accountToDebit.currency.id), {
    folder: TestFolder.LEGACY_TESTS,
  });
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Send - token", () => {
    beforeAll(async () => {
      await beforeAllLegacyFunction(transaction);
    });

    it(`[${transaction.accountToDebit.currency.testLabel}] - Send - invalid amount (${transaction.amount})`, async () => {
      const addressToCredit = transaction.accountToCredit.address;
      await app.send.navigateToSendScreen(
        transaction.accountToDebit,
        transaction.accountToDebit.currency.name,
      );
      await app.send.setRecipientAndContinue({
        address: addressToCredit,
        memoTag: transaction.memoTag,
      });
      await app.send.setAmount(transaction.amount);
      if (expectedErrorMessage instanceof RegExp) {
        await app.send.expectSendAmountSuccess();
        await app.send.amountContinue();

        const amountWithCode =
          transaction.amount + " " + transaction.accountToCredit.currency.ticker;
        await app.send.expectSummaryAmount(amountWithCode);
        await app.send.expectSummaryRecipient(transaction.accountToCredit.address);
        await app.send.chooseFeeStrategy(transaction.speed);
        await app.send.expectSendSummaryError(expectedErrorMessage);
      } else {
        await app.send.expectSendAmountError(expectedErrorMessage);
      }
    });
  });
}

export function runSendMaxTest(options: RunSendTestBaseOptions) {
  const { transaction, tmsLinks, tags } = options;
  setEnv("DISABLE_TRANSACTION_BROADCAST", true);

  setTeamOwner(coinTeamOwner(transaction.accountToDebit.currency.id), {
    folder: TestFolder.LEGACY_TESTS,
  });
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Send - max amount", () => {
    beforeAll(async () => {
      await beforeAllLegacyFunction(transaction);
    });

    it(`[${transaction.accountToDebit.currency.testLabel}] - Send - max amount`, async () => {
      const addressToCredit = transaction.accountToCredit.address;
      await app.send.navigateToSendScreen(transaction.accountToDebit);
      await app.send.setRecipientAndContinue({
        address: addressToCredit,
        memoTag: transaction.memoTag,
      });
      const amount = await app.send.setAmount("max");
      await app.send.expectSendAmountSuccess();
      await app.send.amountContinue();

      await app.send.expectSummaryMaxAmount(amount);
      await app.send.expectSummaryRecipient(addressToCredit);
      await app.send.expectSummaryMemoTag(transaction.memoTag);
    });
  });
}

export function runSendENSTest(options: RunSendTestBaseOptions) {
  const { transaction, tmsLinks, tags } = options;
  setEnv("DISABLE_TRANSACTION_BROADCAST", true);

  setTeamOwner(coinTeamOwner(transaction.accountToDebit.currency.id), {
    folder: TestFolder.LEGACY_TESTS,
  });
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Send - ENS address", () => {
    beforeAll(async () => {
      await beforeAllLegacyFunction(transaction);
    });

    it(`[${transaction.accountToDebit.currency.testLabel}] - Send - ENS address`, async () => {
      const ensName = transaction.accountToCredit.ensName;
      invariant(ensName, "ENS name is not provided");

      await app.send.navigateToSendScreen(transaction.accountToDebit);
      await app.send.setRecipientAndContinue({ address: ensName, memoTag: transaction.memoTag });
      await app.send.setAmountAndContinue(transaction.amount);

      const amountWithCode = transaction.amount + " " + transaction.accountToCredit.currency.ticker;
      await app.send.expectSummaryAmount(amountWithCode);
      await app.send.expectSummaryRecipient(transaction.accountToCredit.address);
      await app.send.expectSummaryRecipientEns(ensName);
      await app.send.expectSummaryMemoTag(transaction.memoTag);
      await app.send.summaryContinue();
      await app.send.dismissHighFeeModal();

      await verifyAppValidationSendInfo(transaction, amountWithCode);

      await app.speculos.signSendTransaction(transaction);
      await app.common.successViewDetails();

      await app.operationDetails.waitForOperationDetails();
      await app.operationDetails.checkAccount(transaction.accountToDebit.accountName);
      await app.operationDetails.checkRecipientAddress(transaction.accountToCredit);
      await app.operationDetails.checkTransactionType("OUT");
    });
  });
}
