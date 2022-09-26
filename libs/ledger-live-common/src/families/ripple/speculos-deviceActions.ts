import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, formatDeviceAmount } from "../../bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Transaction Type",
        button: "Rr",
        expectedValue: () => "Payment",
      },
      {
        title: "Amount",
        button: "Rr",
        expectedValue: ({ account, status }) =>
          formatDeviceAmount(account.currency, status.amount),
      },
      {
        title: "Fee",
        button: "Rr",
        expectedValue: ({ account, status }) =>
          formatDeviceAmount(account.currency, status.estimatedFees),
      },
      {
        title: "Destination Tag",
        button: "Rr",
        expectedValue: ({ transaction }) => String(transaction.tag),
      },
      {
        title: "Destination",
        button: "Rr",
        trimValue: true,
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Account",
        button: "Rr",
        trimValue: true,
        expectedValue: ({ account }) => account.freshAddress,
      },
      {
        title: "Accept",
        button: "LRlr",
      },
      {
        title: "Sign transaction",
        button: "LRlr",
      },
    ],
  });
