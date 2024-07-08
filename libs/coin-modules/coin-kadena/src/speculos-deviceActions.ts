import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, SpeculosButton } from "@ledgerhq/coin-framework/bot/specs";
import { kdaToBaseUnit } from "./utils";
import { KDA_FEES, KDA_FEES_BASE } from "./constants";

export const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Transfer",
      button: SpeculosButton.RIGHT,
      expectedValue: () => "KDA",
    },
    {
      title: "From",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) => {
        return account.freshAddress;
      },
    },
    {
      title: "To",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => {
        return transaction.recipient;
      },
    },
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => {
        return `KDA ${kdaToBaseUnit(transaction.amount).toString()}`;
      },
    },
    {
      title: "Gas Limit",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => {
        return `${transaction.gasLimit.toString()} Max`;
      },
    },
    {
      title: "Gas Price",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => {
        return `KDA ${KDA_FEES_BASE}`;
      },
    },
    {
      title: "ign Transaction?",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Reject",
      button: SpeculosButton.LEFT,
    },
    {
      title: " Confirm",
      button: SpeculosButton.BOTH,
    },
  ],
});
