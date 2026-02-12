import { deviceActionFlow, SpeculosButton } from "@ledgerhq/coin-framework/bot/specs";
import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import { State } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "../types";

export const acceptTransaction: DeviceAction<Transaction, State<Transaction>> = deviceActionFlow({
  steps: [
    {
      title: "Review",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Transaction Type",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Function",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "To (1/2)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "To (2/2)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Gas Fee",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Approve",
      button: SpeculosButton.BOTH,
    },
  ],
});

export const acceptTokenTransaction: DeviceAction<
  Transaction,
  State<Transaction>
> = deviceActionFlow({
  steps: [
    {
      title: "Review",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Transaction Type",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Function",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "To (1/2)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "To (2/2)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Gas Fee",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Approve",
      button: SpeculosButton.BOTH,
    },
  ],
});
