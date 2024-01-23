import { SpeculosButton, deviceActionFlow, formatDeviceAmount } from "../../bot/specs";
import type { DeviceAction, State } from "../../bot/types";
import type { Transaction } from "./types";

export const acceptTransaction: DeviceAction<Transaction, State<Transaction>> = deviceActionFlow({
  steps: [
    {
      title: "Review",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "To",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account, transaction }) =>
        transaction.useAllAmount
          ? "ALL YOUR TONs"
          : formatDeviceAmount(account.currency, transaction.amount),
    },
    {
      title: "Comment",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.comment.text,
    },
    {
      title: "Approve",
      button: SpeculosButton.BOTH,
    },
  ],
});
