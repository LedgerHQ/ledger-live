import invariant from "invariant";
import type { DeviceAction, State } from "@ledgerhq/coin-framework/bot/types";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "@ledgerhq/coin-framework/bot/specs";
import type { Transaction } from "../types";
import { HEDERA_TRANSACTION_KINDS } from "../constants";
import { isTokenAssociateTransaction } from "../logic";

export const acceptTransferTransaction: DeviceAction<
  Transaction,
  State<Transaction>
> = deviceActionFlow({
  steps: [
    {
      title: "Summary",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Operator",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "From",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "To",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account, status: { amount } }) => {
        return formatDeviceAmount(account.currency, amount, {
          postfixCode: true,
          showAllDigits: true,
        }).toLowerCase();
      },
    },
    {
      title: "Max fees",
      button: SpeculosButton.RIGHT,
      // FIXME: should come from transaction.maxFee once swaps feature is merged
      expectedValue: () => "1 hbar",
    },
    {
      title: "Memo",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.memo ?? "",
    },
    {
      title: "Confirm",
      button: SpeculosButton.BOTH,
    },
  ],
});

export const acceptTokenTransaction: DeviceAction<
  Transaction,
  State<Transaction>
> = deviceActionFlow({
  /**
   * Custom fallback function to handle step matching ambiguities in the device flow.
   *
   * This is necessary because the default step matching logic in deviceActionFlow uses
   * `event.text.startsWith(s.title)`, which can cause incorrect matches when step titles
   * are substrings of other text displayed on the device.
   *
   * Specifically:
   * - When "Token ID" appears on screen, it would match with the "To" step (since "Token ID" starts with "To")
   * - This would cause the wrong step to be executed and validation to fail
   *
   * By using exact matching with `event.text === "..."`, we ensure that each screen
   * is correctly identified and the appropriate step logic is executed, preventing
   * false positive matches that occur with the default .startsWith() matching.
   */
  fallback: ({ event }) => {
    if (event.text === "To") {
      return {
        title: "To",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.recipient,
      };
    }

    if (event.text === "Token ID") {
      return {
        title: "Token ID",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction, account }) => {
          invariant(transaction.subAccountId, "Transaction subAccountId is not set");
          const subAccount = account.subAccounts?.find(acc => acc.id === transaction.subAccountId);
          invariant(subAccount, "Sub account not found");

          return subAccount.token.contractAddress;
        },
      };
    }

    return null;
  },
  steps: [
    {
      title: "Review transaction",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "With key",
      button: SpeculosButton.RIGHT,
      expectedValue: () => "#0",
    },
    {
      title: "Operator",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "From",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account, transaction, status: { amount } }) => {
        const subAccount = account.subAccounts?.find(acc => acc.id === transaction.subAccountId);
        invariant(subAccount, `Sub account with address ${transaction.subAccountId} not found`);

        return formatDeviceAmount(subAccount.token, amount, {
          postfixCode: true,
          showAllDigits: true,
        });
      },
    },
    {
      title: "Max fees",
      button: SpeculosButton.RIGHT,
      // FIXME: should come from transaction.maxFee once swaps feature is merged
      expectedValue: () => "1 hbar",
    },
    {
      title: "Memo",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.memo ?? "",
    },
    {
      title: "Confirm",
      button: SpeculosButton.BOTH,
    },
  ],
});

export const acceptTokenAssociateTransaction: DeviceAction<
  Transaction,
  State<Transaction>
> = deviceActionFlow({
  steps: [
    {
      title: "Review transaction",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "With key",
      button: SpeculosButton.RIGHT,
      expectedValue: () => "#0",
    },
    {
      title: "Associate Token",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => {
        invariant(isTokenAssociateTransaction(transaction), "invalid tx type");

        return transaction.properties.token.ticker;
      },
    },
    {
      title: "Token ID",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => {
        invariant(
          transaction.properties?.name === HEDERA_TRANSACTION_KINDS.TokenAssociate.name,
          "Transaction is not a token association",
        );

        return transaction.properties.token.contractAddress;
      },
    },
    {
      title: "Max fees",
      button: SpeculosButton.RIGHT,
      // FIXME: should come from transaction.maxFee once swaps feature is merged
      expectedValue: () => "5 hbar",
    },
    {
      title: "Confirm",
      button: SpeculosButton.BOTH,
    },
  ],
});
