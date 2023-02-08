import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "../../bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Start new",
      },
      {
        title: "ordinary transaction?",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Auxiliary data hash",
        button: SpeculosButton.BOTH,
      },
      {
        title: "Send to address",
        button: SpeculosButton.BOTH,
        ignoreAssertionFailure: true,
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Send",
        button: SpeculosButton.BOTH,
        ignoreAssertionFailure: true,
        expectedValue: ({ account, status }) =>
          formatDeviceAmount(account.currency, status.amount),
      },
      {
        title: "Asset fingerprint",
        button: SpeculosButton.BOTH,
      },
      {
        title: "Token amount",
        button: SpeculosButton.BOTH,
      },
      {
        title: "Confirm",
      },
      {
        title: "output?",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Transaction fee",
        button: SpeculosButton.BOTH,
        ignoreAssertionFailure: true,
        expectedValue: ({ account, status }) =>
          formatDeviceAmount(account.currency, status.estimatedFees),
      },
      {
        title: "Transaction TTL",
        button: SpeculosButton.BOTH,
      },
      {
        title: "...",
      },
      {
        title: "Confirm",
      },
      {
        title: "transaction?",
        button: SpeculosButton.RIGHT,
      },
    ],
  });
