import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, SpeculosButton } from "../../bot/specs";
import { casperAccountHashFromPublicKey } from "./bridge/bridgeHelpers/addresses";

export const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Please",
      button: SpeculosButton.RIGHT,
      expectedValue: () => "review",
    },
    {
      title: "Txn hash",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Type",
      button: SpeculosButton.RIGHT,
      expectedValue: () => "Token transfer",
    },
    {
      title: "Chain ID",
      button: SpeculosButton.RIGHT,
      expectedValue: () => "casper",
    },
    {
      title: "Account",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "Fee",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) =>
        `${transaction.fees.toNumber().toLocaleString("en-US").replaceAll(",", " ")} motes`,
    },
    {
      title: "Target",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) =>
        casperAccountHashFromPublicKey(transaction.recipient, true),
    },
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ status }) =>
        `${status.amount.toNumber().toLocaleString("en-US").replaceAll(",", " ")} motes`,
    },
    {
      title: "APPROVE",
      button: SpeculosButton.BOTH,
    },
  ],
});
