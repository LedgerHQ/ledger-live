import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow } from "../../bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Origin",
        button: "Rr",
        expectedValue: ({ account }) => account.freshAddress,
      },
      {
        title: "Nonce",
        button: "Rr",
        expectedValue: ({ transaction }) =>
          transaction.nonce ? transaction.nonce.toFixed() : "0",
      },
      {
        title: "Fee (uSTX)",
        button: "Rr",
        expectedValue: ({ transaction }) =>
          transaction.fee ? transaction.fee.toFixed() : "0",
      },
      {
        title: "Amount uSTX",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.amount.toFixed(),
      },
      {
        title: "To",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Memo",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.memo || "",
      },
      {
        title: "APPROVE",
        button: "LRlr",
      },
    ],
  });
