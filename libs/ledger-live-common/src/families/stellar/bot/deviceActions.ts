import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "@ledgerhq/ledger-wallet-framework/bot/specs";
import type { DeviceAction } from "@ledgerhq/ledger-wallet-framework/bot/types";
import { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "../types";

function expectedAmount({
  account,
  status,
  transaction,
}: {
  account: Account;
  status: TransactionStatus;
  transaction: Transaction;
}) {
  if (transaction.assetReference && transaction.assetOwner) {
    const amount = formatDeviceAmount(account.currency, status.amount, {
      hideCode: true,
    });

    return `${amount} ${transaction.assetReference}@${truncateAddress(transaction.assetOwner, 3, 4)}`;
  }

  return formatDeviceAmount(account.currency, status.amount, {
    postfixCode: true,
  });
}

function truncateAddress(stellarAddress: string, start = 6, end = 6) {
  return `${stellarAddress.slice(0, start)}..${stellarAddress.slice(-end)}`;
}

export const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Review",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Memo Text",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.memoValue || "",
    },
    {
      title: "Max Fee",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account, status }) =>
        formatCurrencyUnit(getAccountCurrency(account).units[0], status.estimatedFees, {
          disableRounding: true,
        }) + " XLM",
    },
    {
      title: "Sequence Num",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Tx Source",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) => truncateAddress(account.freshAddress),
    },
    {
      title: "Operation Type",
      button: SpeculosButton.RIGHT,
      // Operation type can be Payment (or Create Account) or Change Trust.
      // Create Account type is coming from operation, not transaction.
      // Testing in `specs.ts`.
    },
    {
      title: "Change Trust",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) =>
        `${transaction.assetReference || ""}@${truncateAddress(transaction.assetOwner || "", 3, 4)}`,
      maxY: 5,
    },
    {
      title: "Create Account",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.recipient,
      maxY: 5,
    },
    {
      title: "Send",
      button: SpeculosButton.RIGHT,
      expectedValue: expectedAmount,
    },
    {
      title: "Destination",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Finalize",
      button: SpeculosButton.BOTH,
    },
    {
      title: "Starting Balance",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Network",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Valid Before (UTC)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Valid After (UTC)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Sign",
      button: SpeculosButton.BOTH,
    },
  ],
});
