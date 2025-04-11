import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "../types";
import { deviceActionFlow, SpeculosButton } from "@ledgerhq/coin-framework/bot/specs";
import { State } from "@ledgerhq/coin-framework/bot/types";

export const acceptTransaction: DeviceAction<Transaction, State<Transaction>> = deviceActionFlow({
  steps: [
    {
      title: "Review",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Transaction",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Function",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Coin Type",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Receiver (1/2)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Receiver (2/2)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Amount",
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
