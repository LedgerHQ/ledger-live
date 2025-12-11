import { setEnv } from "@ledgerhq/live-env";
import { verifyAppValidationSendInfo } from "../../models/send";

import { device } from "detox";
import invariant from "invariant";
import { TransactionType } from "@ledgerhq/live-common/e2e/models/Transaction";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

async function navigateToSendScreen(accountName: string) {
  await app.account.openViaDeeplink();
  await app.account.goToAccountByName(accountName);
  await app.account.tapSend();
}

const beforeAllFunction = async (transaction: TransactionType) => {
  await app.init({
    speculosApp: transaction.accountToDebit.currency.speculosApp,
    featureFlags: {
      llmAccountListUI: { enabled: true },
    },
    cliCommands: [
      async (userdataPath?: string) => {
        await CLI.liveData({
          currency: transaction.accountToDebit.currency.speculosApp.name,
          index: transaction.accountToDebit.index,
          add: true,
          appjson: userdataPath,
        });

        const { address } = await CLI.getAddress({
          currency: transaction.accountToCredit.currency.speculosApp.name,
          path: transaction.accountToCredit.accountPath,
          derivationMode: transaction.accountToCredit.derivationMode,
        });

        transaction.accountToCredit.address = address;
        transaction.recipientAddress = address;

        return address;
      },
    ],
  });

  await app.portfolio.waitForPortfolioPageToLoad();
};

const beforeAllInvalidAddressFunction = async (
  transaction: TransactionType,
  overrideRecipient?: string,
) => {
  await app.init({
    speculosApp: transaction.accountToDebit.currency.speculosApp,
    featureFlags: {
      llmAccountListUI: { enabled: true },
    },
    cliCommands: [
      async (userdataPath?: string) => {
        await CLI.liveData({
          currency: transaction.accountToDebit.currency.speculosApp.name,
          index: transaction.accountToDebit.index,
          add: true,
          appjson: userdataPath,
        });

        if (
          transaction.accountToCredit.accountName !== Account.EMPTY.accountName &&
          transaction.accountToCredit.accountName !== Account.BTC_NATIVE_SEGWIT_1.accountName
        ) {
          const { address } = await CLI.getAddress({
            currency: transaction.accountToCredit.currency.id,
            path: transaction.accountToCredit.accountPath,
            derivationMode: transaction.accountToCredit.derivationMode,
          });

          transaction.accountToCredit.address = address;
          return address;
        }

        if (overrideRecipient !== undefined) {
          transaction.accountToCredit.address = overrideRecipient;
          return overrideRecipient;
        }

        return transaction.accountToCredit.address;
      },
    ],
  });

  await app.portfolio.waitForPortfolioPageToLoad();
};

export function runSendTest(
  transaction: TransactionType,
  tmsLinks: string[],
  tags: string[] = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
) {
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Send from 1 account to another", () => {
    beforeAll(async () => {
      await beforeAllFunction(transaction);
    });

    it(`Send from ${transaction.accountToDebit.accountName} to ${transaction.accountToCredit.accountName}`, async () => {
      const addressToCredit = transaction.accountToCredit.address;
      await navigateToSendScreen(transaction.accountToDebit.accountName);
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

      await device.disableSynchronization();
      await app.speculos.signSendTransaction(transaction);
      await app.common.successViewDetails();

      await app.operationDetails.waitForOperationDetails();
      await app.operationDetails.checkAccount(transaction.accountToDebit.accountName);
      await app.operationDetails.checkRecipientAddress(transaction.accountToCredit);
      await app.operationDetails.checkTransactionType("OUT");
    });
  });
}

export function runSendInvalidAddressTest(
  transaction: TransactionType,
  expectedErrorMessage: string,
  address: string | undefined,
  tmsLinks: string[],
  tags: string[] = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
  accountName?: string,
) {
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Send - invalid address input", () => {
    beforeAll(async () => {
      await beforeAllInvalidAddressFunction(transaction, address);
    });

    it(`Send from ${transaction.accountToDebit.accountName} ${accountName || ""} to ${transaction.accountToCredit.accountName} - invalid address input`, async () => {
      const recipientAddress = address ?? transaction.accountToCredit.address;
      await navigateToSendScreen(accountName || transaction.accountToDebit.accountName);
      await app.send.setRecipient(recipientAddress, transaction.memoTag);
      await app.send.expectSendRecipientError(expectedErrorMessage);
    });
  });
}

export function runSendValidAddressTest(
  transaction: TransactionType,
  tmsLinks: string[],
  testName: string,
  tags: string[] = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
  accountName?: string,
  expectedWarningMessage?: string,
) {
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Send - valid address & amount input", () => {
    beforeAll(async () => {
      await beforeAllFunction(transaction);
    });

    it(`Send from ${transaction.accountToDebit.accountName} ${accountName || ""} to ${transaction.accountToCredit.accountName} (${testName})`, async () => {
      await navigateToSendScreen(accountName || transaction.accountToDebit.accountName);
      const shouldLowerCaseRecipientAddress =
        transaction.accountToCredit === Account.ETH_2_LOWER_CASE ||
        testName.toLowerCase().includes("lower case");

      const baseRecipientAddress = transaction.accountToCredit.address ?? "";
      const recipientAddress = shouldLowerCaseRecipientAddress
        ? baseRecipientAddress.toLowerCase()
        : baseRecipientAddress;
      transaction.accountToCredit.address = recipientAddress;
      console.log("recipientAddress", recipientAddress);
      await app.send.setRecipient(recipientAddress, transaction.memoTag);
      await app.send.expectSendRecipientSuccess(expectedWarningMessage);
      await app.send.recipientContinue(transaction.memoTag);
      await app.send.setAmountAndContinue(transaction.amount);

      const amountWithCode = transaction.amount + " " + transaction.accountToCredit.currency.ticker;
      await app.send.expectSummaryAmount(amountWithCode);
      await app.send.expectSummaryRecipient(transaction.accountToCredit.address);
      await app.send.expectSummaryMemoTag(transaction.memoTag);
      if (expectedWarningMessage) await app.send.expectSummaryWarning(expectedWarningMessage);
    });
  });
}

export function runSendInvalidAmountTest(
  transaction: TransactionType,
  expectedErrorMessage: string,
  tmsLinks: string[],
  tags: string[] = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
) {
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Check invalid amount input error", () => {
    beforeAll(async () => {
      await beforeAllFunction(transaction);
    });

    it(`Check "${expectedErrorMessage}" for ${transaction.accountToDebit.currency.name} - invalid amount ${transaction.amount} input error`, async () => {
      await navigateToSendScreen(transaction.accountToDebit.accountName);
      await app.send.setRecipientAndContinue(
        transaction.accountToCredit.address,
        transaction.memoTag,
      );
      await app.send.setAmount(transaction.amount);
      await app.send.expectSendAmountError(expectedErrorMessage);
    });
  });
}

export function runSendInvalidTokenAmountTest(
  transaction: TransactionType,
  expectedErrorMessage: RegExp | string,
  tmsLinks: string[],
  tags: string[] = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
) {
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Send token (subAccount) - invalid amount input", () => {
    beforeAll(async () => {
      await beforeAllFunction(transaction);
    });

    it(`Check error message for ${transaction.accountToDebit.currency.name} - invalid amount ${transaction.amount} input error`, async () => {
      const addressToCredit = transaction.accountToCredit.address;
      await navigateToSendScreen(transaction.accountToDebit.currency.name);
      await app.send.setRecipientAndContinue(addressToCredit, transaction.memoTag);
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

export function runSendMaxTest(
  transaction: TransactionType,
  tmsLinks: string[],
  tags: string[] = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
) {
  setEnv("DISABLE_TRANSACTION_BROADCAST", true);

  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Verify send max user flow", () => {
    beforeAll(async () => {
      await beforeAllFunction(transaction);
    });

    it(`Check Valid amount input (${transaction.amount}) - ${transaction.accountToCredit.accountName}`, async () => {
      const addressToCredit = transaction.accountToCredit.address;
      await navigateToSendScreen(transaction.accountToDebit.accountName);
      await app.send.setRecipientAndContinue(addressToCredit, transaction.memoTag);
      const amount = await app.send.setAmount("max");
      await app.send.expectSendAmountSuccess();
      await app.send.amountContinue();

      await app.send.expectSummaryMaxAmount(amount);
      await app.send.expectSummaryRecipient(addressToCredit);
      await app.send.expectSummaryMemoTag(transaction.memoTag);
    });
  });
}

export function runSendENSTest(
  transaction: TransactionType,
  tmsLinks: string[],
  tags: string[] = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
) {
  setEnv("DISABLE_TRANSACTION_BROADCAST", true);

  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("User sends funds to ENS address", () => {
    beforeAll(async () => {
      await beforeAllFunction(transaction);
    });

    it(`User sends funds to ENS address - ${transaction.accountToCredit.ensName}`, async () => {
      const ensName = transaction.accountToCredit.ensName;
      invariant(ensName, "ENS name is not provided");

      await navigateToSendScreen(transaction.accountToDebit.accountName);
      await app.send.setRecipientAndContinue(ensName, transaction.memoTag);
      await app.send.setAmountAndContinue(transaction.amount);

      const amountWithCode = transaction.amount + " " + transaction.accountToCredit.currency.ticker;
      await app.send.expectSummaryAmount(amountWithCode);
      await app.send.expectSummaryRecipient(transaction.accountToCredit.address);
      await app.send.expectSummaryRecipientEns(ensName);
      await app.send.expectSummaryMemoTag(transaction.memoTag);
      await app.send.summaryContinue();
      await app.send.dismissHighFeeModal();

      await verifyAppValidationSendInfo(transaction, amountWithCode);

      await device.disableSynchronization();
      await app.speculos.signSendTransaction(transaction);
      await app.common.successViewDetails();

      await app.operationDetails.waitForOperationDetails();
      await app.operationDetails.checkAccount(transaction.accountToDebit.accountName);
      await app.operationDetails.checkRecipientAddress(transaction.accountToCredit);
      await app.operationDetails.checkTransactionType("OUT");
    });
  });
}
