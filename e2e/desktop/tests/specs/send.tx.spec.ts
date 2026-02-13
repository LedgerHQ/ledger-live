import { test } from "tests/fixtures/common";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { addBugLink, addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { CLI } from "tests/utils/cliUtils";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";
import {
  getAccountAddress,
  liveDataWithRecipientAddressCommand,
} from "tests/utils/cliCommandsUtils";
import { Addresses } from "@ledgerhq/live-common/e2e/enum/Addresses";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

//Warning 🚨: XRP Tests may fail due to API HTTP 429 issue - Jira: LIVE-14237

const transactionsAmountInvalid = [
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_2, "", Fee.MEDIUM),
    expectedErrorMessage: null,
    xrayTicket: "B2CQA-2568",
  },
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_2, "0", Fee.MEDIUM),
    expectedErrorMessage: null,
    xrayTicket: "B2CQA-2569",
  },
  {
    transaction: new Transaction(Account.XRP_1, Account.XRP_3, "0.1", undefined, "noTag"),
    expectedErrorMessage: "Recipient address is inactive. Send at least 1 XRP to activate it",
    xrayTicket: "B2CQA-2571",
  },
  {
    transaction: new Transaction(Account.DOT_1, Account.DOT_3, "0.5"),
    expectedErrorMessage: "Recipient address is inactive. Send at least 1 DOT to activate it",
    xrayTicket: "B2CQA-2570",
  },
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_2, "100", Fee.MEDIUM),
    expectedErrorMessage: "Sorry, insufficient funds",
    xrayTicket: "B2CQA-2572",
  },
  {
    transaction: new Transaction(Account.HEDERA_1, Account.HEDERA_2, "100000", undefined, "noTag"),
    expectedErrorMessage: "Sorry, insufficient funds",
    xrayTicket: "B2CQA-4281",
  },
];

const transactionsAddressInvalid = [
  {
    transaction: new Transaction(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "0.00001", Fee.MEDIUM),
    address: Addresses.BTC_NATIVE_SEGWIT_1,
    expectedErrorMessage: "This is not a valid Ethereum address",
    xrayTicket: "B2CQA-2709",
  },
  {
    transaction: new Transaction(Account.ETH_1, Account.EMPTY, "0.00001", Fee.MEDIUM),
    address: " ",
    expectedErrorMessage: null,
    xrayTicket: "B2CQA-2710",
  },
  {
    transaction: new Transaction(Account.DOT_1, Account.DOT_1, "0.5"),
    address: undefined,
    expectedErrorMessage: "Recipient address is the same as the sender address",
    xrayTicket: "B2CQA-2711",
  },
  {
    transaction: new Transaction(Account.XRP_1, Account.XRP_1, "1", undefined, "123456"),
    address: undefined,
    expectedErrorMessage: "Recipient address is the same as the sender address",
    xrayTicket: "B2CQA-2712",
  },
  {
    transaction: new Transaction(Account.ATOM_1, Account.ATOM_1, "0.00001"),
    address: undefined,
    expectedErrorMessage: "Recipient address is the same as the sender address",
    xrayTicket: "B2CQA-2713",
  },
  {
    transaction: new Transaction(Account.HEDERA_1, Account.HEDERA_1, "0.00001", undefined, "noTag"),
    expectedErrorMessage: "Recipient address is the same as the sender address",
    xrayTicket: "B2CQA-4282",
  },
];

const transactionAddressValid = [
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_3, "0.00001", Fee.MEDIUM),
    expectedWarningMessage: null,
    xrayTicket: "B2CQA-2714",
  },
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_2, "0.00001", Fee.MEDIUM),
    expectedWarningMessage: null,
    xrayTicket: "B2CQA-2715, B2CQA-2716",
  },
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_2_LOWER_CASE, "0.0001", Fee.MEDIUM),
    expectedWarningMessage: "Auto-verification not available: carefully verify the address",
    xrayTicket: "B2CQA-2717",
  },
  {
    transaction: new Transaction(Account.XRP_1, Account.XRP_2, "1", undefined, "123456"),
    expectedWarningMessage: null,
    xrayTicket: "B2CQA-2718",
  },
  {
    transaction: new Transaction(Account.XRP_1, Account.XRP_2, "2"),
    expectedWarningMessage: null,
    xrayTicket: "B2CQA-2719",
  },
  {
    transaction: new Transaction(Account.ATOM_1, Account.ATOM_2, "0.00001", undefined, "123456"),
    expectedWarningMessage: null,
    xrayTicket: "B2CQA-2720",
  },
  {
    transaction: new Transaction(Account.ATOM_1, Account.ATOM_2, "0.0001"),
    expectedWarningMessage: null,
    xrayTicket: "B2CQA-2721",
  },
  {
    transaction: new Transaction(Account.BTC_LEGACY_1, Account.BTC_LEGACY_2, "0.00001", Fee.MEDIUM),
    expectedWarningMessage: null,
    xrayTicket: "B2CQA-2722",
  },
  {
    transaction: new Transaction(Account.BTC_SEGWIT_1, Account.BTC_SEGWIT_2, "0.00001", Fee.MEDIUM),
    expectedWarningMessage: null,
    xrayTicket: "B2CQA-2723",
  },
  {
    transaction: new Transaction(
      Account.BTC_NATIVE_SEGWIT_1,
      Account.BTC_NATIVE_SEGWIT_2,
      "0.00001",
      Fee.MEDIUM,
    ),
    expectedWarningMessage: null,
    xrayTicket: "B2CQA-2724",
  },
  {
    transaction: new Transaction(
      Account.BTC_TAPROOT_1,
      Account.BTC_TAPROOT_2,
      "0.00001",
      Fee.MEDIUM,
    ),
    expectedWarningMessage: null,
    xrayTicket: "B2CQA-2725",
  },
  {
    transaction: new Transaction(Account.BCH_1, Account.BCH_2, "0.00001", Fee.MEDIUM),
    expectedWarningMessage: null,
    xrayTicket: "B2CQA-2726",
  },
];

const transactionE2E = [
  {
    transaction: new Transaction(Account.sep_ETH_1, Account.sep_ETH_2, "0.00001", Fee.SLOW),
    xrayTicket: "B2CQA-2574",
  },
  {
    transaction: new Transaction(Account.POL_1, Account.POL_2, "0.001", Fee.SLOW),
    xrayTicket: "B2CQA-2807",
  },
  {
    transaction: new Transaction(Account.DOGE_1, Account.DOGE_2, "0.01", Fee.SLOW),
    xrayTicket: "B2CQA-2573",
  },
  {
    transaction: new Transaction(Account.BCH_1, Account.BCH_2, "0.0001", Fee.SLOW),
    xrayTicket: "B2CQA-2808",
  },
  {
    transaction: new Transaction(Account.DOT_1, Account.DOT_2, "0.0001"),
    xrayTicket: "B2CQA-2809",
  },
  {
    transaction: new Transaction(Account.ALGO_1, Account.ALGO_2, "0.001"),
    xrayTicket: "B2CQA-2810",
  },
  {
    transaction: new Transaction(Account.SOL_1, Account.SOL_2, "0.000001", undefined, "noTag"),
    xrayTicket: "B2CQA-2811",
  },
  {
    transaction: new Transaction(Account.TRX_1, Account.TRX_2, "0.01"),
    xrayTicket: "B2CQA-2812",
  },
  {
    transaction: new Transaction(Account.XLM_1, Account.XLM_2, "0.0001", undefined, "noTag"),
    xrayTicket: "B2CQA-2813",
    bugTicket: "LIVE-24214",
  },
  {
    transaction: new Transaction(Account.ATOM_1, Account.ATOM_2, "0.00001", undefined, "noTag"),
    xrayTicket: "B2CQA-2814",
  },
  {
    transaction: new Transaction(Account.ADA_1, Account.ADA_2, "1", undefined, "noTag"),
    xrayTicket: "B2CQA-2815",
  },
  {
    transaction: new Transaction(Account.XRP_1, Account.XRP_2, "0.0001", undefined, "noTag"),
    xrayTicket: "B2CQA-2816",
  },
  {
    transaction: new Transaction(Account.APTOS_1, Account.APTOS_2, "0.0001"),
    xrayTicket: "B2CQA-2920",
  },
  {
    transaction: new Transaction(
      Account.BTC_NATIVE_SEGWIT_1,
      Account.BTC_NATIVE_SEGWIT_2,
      "0.00001",
      Fee.MEDIUM,
    ),
    xrayTicket: "B2CQA-3925",
  },
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_3, "0.0001", Fee.SLOW),
    xrayTicket: "B2CQA-3924",
  },
  {
    transaction: new Transaction(Account.KASPA_1, Account.KASPA_2, "0.2"),
    xrayTicket: "B2CQA-3840",
  },
  {
    transaction: new Transaction(Account.SUI_1, Account.SUI_2, "0.0001", undefined),
    xrayTicket: "B2CQA-3802",
  },
  {
    transaction: new Transaction(Account.BASE_1, Account.BASE_2, "0.000001"),
    xrayTicket: "B2CQA-4225",
  },
  {
    transaction: new Transaction(Account.VET_1, Account.VET_2, "0.1"),
    xrayTicket: "B2CQA-4247",
  },
  {
    transaction: new Transaction(Account.ZEC_1, Account.ZEC_2, "0.001"),
    xrayTicket: "B2CQA-4299",
  },
  {
    transaction: new Transaction(Account.HEDERA_1, Account.HEDERA_2, "0.00001", undefined, "noTag"),
    xrayTicket: "B2CQA-4284",
  },
];

test.describe("Send flows", () => {
  for (const transaction of transactionE2E) {
    test.describe("Send from 1 account to another", () => {
      test.use({
        userdata: "skip-onboarding",
        speculosApp: transaction.transaction.accountToDebit.currency.speculosApp,
        cliCommands: [liveDataWithRecipientAddressCommand(transaction.transaction)],
      });

      const family = getFamilyByCurrencyId(transaction.transaction.accountToDebit.currency.id);

      test(
        `Send from ${transaction.transaction.accountToDebit.accountName} to ${transaction.transaction.accountToCredit.accountName}`,
        {
          tag: [
            "@NanoSP",
            ...(transaction.transaction.accountToDebit.currency.id !== Currency.SUI.id &&
            transaction.transaction.accountToDebit.currency.id !== Currency.HBAR.id &&
            transaction.transaction.accountToDebit.currency.id !== Currency.VET.id
              ? ["@LNS"]
              : []),
            "@NanoX",
            "@Stax",
            "@Flex",
            "@NanoGen5",
            `@${transaction.transaction.accountToDebit.currency.id}`,
            ...(family ? [`@family-${family}`] : []),
            ...(transaction.transaction.accountToDebit === Account.BTC_NATIVE_SEGWIT_1
              ? ["@smoke"]
              : []),
          ],
          annotation: { type: "TMS", description: transaction.xrayTicket },
        },
        async ({ app }) => {
          await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
          if (transaction.bugTicket) {
            await addBugLink([transaction.bugTicket]);
          }

          await app.layout.goToAccounts();
          await app.accounts.navigateToAccountByName(
            transaction.transaction.accountToDebit.accountName,
          );

          await app.account.clickSend();
          await app.send.craftTx(transaction.transaction);
          await app.send.continueAmountModal();
          await app.send.expectTxInfoValidity(transaction.transaction);
          await app.send.clickContinueToDevice();

          await app.speculos.signSendTransaction(transaction.transaction);
          await app.send.expectTxSent();
          await app.account.navigateToViewDetails();
          await app.sendDrawer.addressValueIsVisible(
            transaction.transaction.accountToCredit.address,
          );
        },
      );
    });
  }

  for (const transaction of transactionsAmountInvalid) {
    test.describe("Check invalid amount input error", () => {
      test.use({
        userdata: "skip-onboarding",
        speculosApp: transaction.transaction.accountToDebit.currency.speculosApp,
        cliCommands: [liveDataWithRecipientAddressCommand(transaction.transaction)],
      });

      const family = getFamilyByCurrencyId(transaction.transaction.accountToDebit.currency.id);

      test(
        `Check "${transaction.expectedErrorMessage}" for ${transaction.transaction.accountToDebit.currency.name} - invalid amount ${transaction.transaction.amount} input error`,
        {
          tag: [
            "@NanoSP",
            "@LNS",
            "@NanoX",
            "@Stax",
            "@Flex",
            "@NanoGen5",
            `@${transaction.transaction.accountToDebit.currency.id}`,
            ...(family ? [`@family-${family}`] : []),
          ],
          annotation: { type: "TMS", description: transaction.xrayTicket },
        },
        async ({ app }) => {
          await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

          await app.layout.goToAccounts();
          await app.accounts.navigateToAccountByName(
            transaction.transaction.accountToDebit.accountName,
          );
          await app.account.clickSend();

          await app.send.craftTx(transaction.transaction);
          await app.send.checkContinueButtonDisabled();
          await app.send.checkErrorMessage(transaction.expectedErrorMessage);
        },
      );
    });
  }

  test.describe("Verify send max user flow", () => {
    const transactionInputValid = new Transaction(
      Account.ETH_1,
      Account.ETH_2,
      "send max",
      Fee.MEDIUM,
    );

    test.use({
      userdata: "skip-onboarding",
      speculosApp: transactionInputValid.accountToDebit.currency.speculosApp,
      cliCommands: [liveDataWithRecipientAddressCommand(transactionInputValid)],
    });

    const family = getFamilyByCurrencyId(transactionInputValid.accountToDebit.currency.id);

    test(
      `Check Valid amount input (${transactionInputValid.amount})`,
      {
        tag: [
          "@NanoSP",
          "@LNS",
          "@NanoX",
          "@Stax",
          "@Flex",
          "@NanoGen5",
          `@${transactionInputValid.accountToDebit.currency.id}`,
          ...(family ? [`@family-${family}`] : []),
        ],
        annotation: {
          type: "TMS",
          description: "B2CQA-473",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(
          transactionInputValid.accountToDebit.accountName,
        );

        await app.account.clickSend();
        await app.send.fillRecipient(transactionInputValid.accountToCredit.address);
        await app.send.continue();
        await app.send.fillAmount(transactionInputValid.amount);
        await app.send.checkContinueButtonEnable();
        await app.send.checkInputErrorVisibility("hidden");
      },
    );
  });

  for (const transaction of transactionAddressValid) {
    test.describe("Send funds step 1 (Recipient) - positive cases (Button enabled)", () => {
      test.use({
        userdata: "skip-onboarding",
        speculosApp: transaction.transaction.accountToDebit.currency.speculosApp,
        cliCommands: [
          liveDataWithRecipientAddressCommand(transaction.transaction, { useScheme: true }),
        ],
      });

      const family = getFamilyByCurrencyId(transaction.transaction.accountToDebit.currency.id);

      test(
        `Check button enabled (${transaction.transaction.amount} from ${transaction.transaction.accountToDebit.accountName} to ${transaction.transaction.accountToCredit.accountName}) - valid address input (${transaction.xrayTicket})`,
        {
          tag: [
            "@NanoSP",
            "@LNS",
            "@NanoX",
            "@Stax",
            "@Flex",
            "@NanoGen5",
            `@${transaction.transaction.accountToDebit.currency.id}`,
            ...(family ? [`@family-${family}`] : []),
          ],
          annotation: {
            type: "TMS",
            description: transaction.xrayTicket,
          },
        },
        async ({ app }) => {
          await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

          await app.layout.goToAccounts();
          await app.accounts.navigateToAccountByName(
            transaction.transaction.accountToDebit.accountName,
          );

          await app.account.clickSend();
          transaction.transaction.accountToCredit.address =
            transaction.transaction.accountToCredit === Account.ETH_2_LOWER_CASE
              ? (transaction.transaction.accountToCredit.address ?? "").toLowerCase()
              : transaction.transaction.accountToCredit.address ?? "";

          await app.send.fillRecipientInfo(transaction.transaction);
          await app.send.checkInputWarningMessage(transaction.expectedWarningMessage);
          await app.send.checkContinueButtonEnable();
        },
      );
    });
  }

  for (const transaction of transactionsAddressInvalid) {
    test.describe("Send funds step 1 (Recipient) - negative cases (Button disabled)", () => {
      test.use({
        userdata: "skip-onboarding",
        speculosApp: transaction.transaction.accountToDebit.currency.speculosApp,
        cliCommands: [
          async (appjsonPath: string) => {
            await CLI.liveData({
              currency: transaction.transaction.accountToDebit.currency.id,
              index: transaction.transaction.accountToDebit.index,
              add: true,
              appjson: appjsonPath,
            });

            if (
              transaction.transaction.accountToCredit !== Account.EMPTY &&
              transaction.transaction.accountToCredit !== Account.BTC_NATIVE_SEGWIT_1
            ) {
              const receiveAddress = await getAccountAddress(
                transaction.transaction.accountToCredit,
              );
              transaction.address = receiveAddress;

              return receiveAddress;
            }

            return transaction.address;
          },
        ],
      });

      const family = getFamilyByCurrencyId(transaction.transaction.accountToDebit.currency.id);

      test(
        `Check "${transaction.expectedErrorMessage}" (from ${transaction.transaction.accountToDebit.accountName} to ${transaction.transaction.accountToCredit.accountName}) - invalid address input error`,
        {
          tag: [
            "@NanoSP",
            "@LNS",
            "@NanoX",
            "@Stax",
            "@Flex",
            "@NanoGen5",
            `@${transaction.transaction.accountToDebit.currency.id}`,
            ...(family ? [`@family-${family}`] : []),
          ],
          annotation: {
            type: "TMS",
            description: transaction.xrayTicket,
          },
        },
        async ({ app }) => {
          await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

          await app.layout.goToAccounts();
          await app.accounts.navigateToAccountByName(
            transaction.transaction.accountToDebit.accountName,
          );

          await app.account.clickSend();
          await app.send.fillRecipient(transaction.address);
          await app.send.checkErrorMessage(transaction.expectedErrorMessage);
          await app.send.checkContinueButtonDisabled();
        },
      );
    });
  }

  const originalValue = process.env.DISABLE_TRANSACTION_BROADCAST;

  test.describe("User sends funds to ENS address", () => {
    const transactionEnsAddress = new Transaction(
      Account.ETH_1,
      Account.ETH_2_WITH_ENS,
      "0.0001",
      Fee.MEDIUM,
    );

    test.beforeAll(async () => {
      process.env.DISABLE_TRANSACTION_BROADCAST = "1";
    });

    test.use({
      userdata: "skip-onboarding",
      speculosApp: transactionEnsAddress.accountToDebit.currency.speculosApp,
      cliCommands: [liveDataWithRecipientAddressCommand(transactionEnsAddress)],
    });

    const family = getFamilyByCurrencyId(transactionEnsAddress.accountToDebit.currency.id);

    test(
      `User sends funds to ENS address - ${transactionEnsAddress.accountToCredit.ensName}`,
      {
        tag: [
          "@NanoSP",
          "@LNS",
          "@NanoX",
          "@Stax",
          "@Flex",
          "@NanoGen5",
          `@${transactionEnsAddress.accountToDebit.currency.id}`,
          ...(family ? [`@family-${family}`] : []),
        ],
        annotation: {
          type: "TMS",
          description: "B2CQA-2202",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(
          transactionEnsAddress.accountToDebit.accountName,
        );

        await app.account.clickSend();
        await app.send.craftTx(transactionEnsAddress);
        await app.send.continueAmountModal();
        await app.send.expectTxInfoValidity(transactionEnsAddress);
        await app.send.clickContinueToDevice();

        await app.speculos.signSendTransaction(transactionEnsAddress);
        await app.send.expectTxSent();
        await app.account.navigateToViewDetails();
        await app.sendDrawer.addressValueIsVisible(transactionEnsAddress.accountToCredit.address);
        await app.drawer.closeDrawer();
      },
    );

    test.afterAll(() => {
      if (originalValue !== undefined) {
        process.env.DISABLE_TRANSACTION_BROADCAST = originalValue;
      } else {
        delete process.env.DISABLE_TRANSACTION_BROADCAST;
      }
    });
  });
});
