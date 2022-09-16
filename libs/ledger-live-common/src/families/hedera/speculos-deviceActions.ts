import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { deviceActionFlow } from "../../bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Transfer",
      },
      {
        title: "with Key #0?",
        button: "Rr",
      },
      {
        title: "Operator",
        button: "Rr",
        expectedValue: ({ account }) => account.freshAddress,
      },
      {
        title: "Sender",
        button: "Rr",
        expectedValue: ({ account }) => account.freshAddress,
      },
      {
        title: "Recipient",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Amount",
        button: "Rr",
        expectedValue: ({ account: { unit }, transaction: { amount } }) =>
          formatCurrencyUnit(unit, amount, {
            disableRounding: true,
            showAllDigits: true,
          }) + " hbar",
      },
      {
        title: "Fee",
        button: "Rr",
        expectedValue: ({ account: { unit }, status: { estimatedFees } }) =>
          formatCurrencyUnit(unit, estimatedFees, {
            disableRounding: true,
            showAllDigits: true,
          }) + " hbar",
      },
      {
        title: "Max Fee",
        button: "Rr",
        expectedValue: () => "1 hbar",
      },
      {
        title: "Memo",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.memo as string,
      },
      {
        title: "Confirm",
        button: "LRlr",
      },
    ],
  });
