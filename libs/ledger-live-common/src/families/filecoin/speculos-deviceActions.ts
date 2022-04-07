import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow } from "../../bot/specs";
import { formatCurrencyUnit } from "../../currencies";

const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "To",
      button: "Rr",
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "From",
      button: "Rr",
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "Nonce",
      button: "Rr",
      expectedValue: ({ transaction }) => transaction.nonce.toString(),
    },
    {
      title: "Value",
      button: "Rr",
      expectedValue: ({ account, status }) =>
        formatCurrencyUnit(account.unit, status.amount, {
          disableRounding: true,
          showAllDigits: true,
        }),
    },
    {
      title: "Gas Limit",
      button: "Rr",
      expectedValue: ({ transaction }) => transaction.gasLimit.toFixed(),
    },
    {
      title: "Gas Premium",
      button: "Rr",
      expectedValue: ({ account, transaction }) =>
        formatCurrencyUnit(account.unit, transaction.gasPremium, {
          disableRounding: true,
          showAllDigits: true,
        }),
    },
    {
      title: "Gas Fee Cap",
      button: "Rr",
      expectedValue: ({ account, transaction }) =>
        formatCurrencyUnit(account.unit, transaction.gasFeeCap, {
          disableRounding: true,
          showAllDigits: true,
        }),
    },
    {
      title: "Method",
      button: "Rr",
      expectedValue: () => "Transfer",
    },
    {
      title: "APPROVE",
      button: "LRlr",
    },
  ],
});

export default { acceptTransaction };
