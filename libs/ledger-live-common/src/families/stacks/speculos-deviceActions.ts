import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, SpeculosButton } from "../../bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Please",
      button: SpeculosButton.RIGHT,
      expectedValue: () => "review",
    },
    {
      title: "Origin",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "Nonce",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => (transaction.nonce ? transaction.nonce.toFixed() : "0"),
    },
    {
      title: "Fee (uSTX)",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => (transaction.fee ? transaction.fee.toFixed() : "0"),
    },
    {
      title: "Amount uSTX",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ status }) => status.amount.toFixed(),
    },
    {
      title: "To",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Memo",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.memo || "",
    },
    {
      title: "APPROVE",
      button: SpeculosButton.BOTH,
    },
  ],
});
