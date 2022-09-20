import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, formatDeviceAmount } from "../../bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
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
          formatDeviceAmount(account.currency, status.amount, {
            hideCode: true,
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
          formatDeviceAmount(account.currency, transaction.gasPremium, {
            hideCode: true,
            showAllDigits: true,
          }),
      },
      {
        title: "Gas Fee Cap",
        button: "Rr",
        expectedValue: ({ account, transaction }) =>
          formatDeviceAmount(account.currency, transaction.gasFeeCap, {
            hideCode: true,
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
