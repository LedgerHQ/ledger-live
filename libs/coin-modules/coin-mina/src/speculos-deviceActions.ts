import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, SpeculosButton } from "@ledgerhq/coin-framework/bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Get",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Path",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Generate",
      button: SpeculosButton.BOTH,
    },
    {
      title: "Address",
      button: SpeculosButton.BOTH,
    },
    {
      title: "Approve",
      button: SpeculosButton.BOTH,
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
      expectedValue: ({ transaction }) => `${transaction.fees.toNumber()} mina`,
    },
    {
      title: "Target",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ status }) => `${status.amount.toNumber()} mina`,
    },
    {
      title: "APPROVE",
      button: SpeculosButton.BOTH,
    },
  ],
});
