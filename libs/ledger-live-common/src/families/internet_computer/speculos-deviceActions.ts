import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, formatDeviceAmount } from "../../bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Transaction type",
        button: "Rr",
      },
      {
        title: "From account",
        button: "Rr",
        expectedValue: ({ account }) =>
          account.freshAddress.match(/.{1,8}/g)?.join(" ") ?? "",
      },
      {
        title: "To account",
        button: "Rr",
        expectedValue: ({ transaction }) =>
          transaction.recipient.match(/.{1,8}/g)?.join(" ") ?? "",
      },
      {
        title: "Payment (ICP)",
        button: "Rr",
        expectedValue: ({ status, account }) =>
          formatDeviceAmount(account.currency, status.amount, {
            hideCode: true,
            showAllDigits: false,
          }),
      },
      {
        title: "Maximum fee (ICP)",
        button: "Rr",
        expectedValue: ({ status, account }) =>
          formatDeviceAmount(account.currency, status.estimatedFees, {
            hideCode: true,
            showAllDigits: false,
          }),
      },
      {
        title: "Memo",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.memo ?? "0",
      },
      {
        title: "APPROVE",
        button: "LRlr",
      },
    ],
  });
