import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, formatDeviceAmount, SpeculosButton } from "../../bot/specs";
import { State } from "@ledgerhq/coin-framework/bot/types";

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
      expectedValue: ({ account, status }) =>
        formatDeviceAmount(account.currency, status.amount, {
          forceFloating: true,
        }),
    },
    {
      title: "Gas Fee",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Accept",
      button: SpeculosButton.BOTH,
    },
  ],
});
