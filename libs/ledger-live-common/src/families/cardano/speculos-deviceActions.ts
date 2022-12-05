import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, formatDeviceAmount } from "../../bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Start new",
      },
      {
        title: "ordinary transaction?",
        button: "Rr",
      },
      {
        title: "Auxiliary data hash",
        button: "LRlr",
      },
      {
        title: "Send to address",
        button: "LRlr",
        ignoreAssertionFailure: true,
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Send",
        button: "LRlr",
        ignoreAssertionFailure: true,
        expectedValue: ({ account, status }) =>
          formatDeviceAmount(account.currency, status.amount),
      },
      {
        title: "Asset fingerprint",
        button: "LRlr",
      },
      {
        title: "Token amount",
        button: "LRlr",
      },
      {
        title: "Confirm",
      },
      {
        title: "output?",
        button: "Rr",
      },
      {
        title: "Transaction fee",
        button: "LRlr",
        ignoreAssertionFailure: true,
        expectedValue: ({ account, status }) =>
          formatDeviceAmount(account.currency, status.estimatedFees),
      },
      {
        title: "Transaction TTL",
        button: "LRlr",
      },
      {
        title: "...",
      },
      {
        title: "Confirm",
      },
      {
        title: "transaction?",
        button: "Rr",
      },
    ],
  });
