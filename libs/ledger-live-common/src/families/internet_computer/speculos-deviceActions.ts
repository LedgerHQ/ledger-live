import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow } from "../../bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Transaction type",
        button: "Rr",
        expectedValue: () => "Send ICP" || "Check status",
      },
      {
        title: "From account",
        button: "Rr",
        expectedValue: ({ account }) => account.freshAddress,
      },
      {
        title: "To account",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Payment (ICP)",
        button: "Rr",
        expectedValue: ({ status }) => status.amount.toString(),
      },
      {
        title: "Maximum fee (ICP)",
        button: "Rr",
        expectedValue: ({ status }) => status.estimatedFees.toString(),
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
