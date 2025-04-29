import { deviceActionFlow, SpeculosButton } from "@ledgerhq/coin-framework/bot/specs";
import { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import { casperGetCLPublicKey } from "../bridge/bridgeHelpers/addresses";
import type { Transaction } from "../types";

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
      expectedValue: ({ account }) => casperGetCLPublicKey(account.freshAddress).toHex(true),
    },
    {
      title: "Fee",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) =>
        `${transaction.fees.toNumber().toLocaleString("en-US").replace(/,/g, " ")} motes`,
    },
    {
      title: "Target",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => casperGetCLPublicKey(transaction.recipient).toHex(true),
    },
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ status }) =>
        `${status.amount.toNumber().toLocaleString("en-US").replace(/,/g, " ")} motes`,
    },
    {
      title: "APPROVE",
      button: SpeculosButton.BOTH,
    },
  ],
});
