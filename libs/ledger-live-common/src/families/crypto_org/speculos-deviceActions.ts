import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, SpeculosButton } from "../../bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Review",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Chain ID",
        button: SpeculosButton.RIGHT,
        // TODO: add a expectedValue fn
      },
      {
        title: "Account",
        button: SpeculosButton.RIGHT,
        // TODO: add a expectedValue fn
      },
      {
        title: "Sequence",
        button: SpeculosButton.RIGHT,
        // TODO: add a expectedValue fn
      },
      {
        title: "Type",
        button: SpeculosButton.RIGHT,
        // TODO: add a expectedValue fn
      },
      {
        title: "Amount",
        button: SpeculosButton.RIGHT,
        // TODO: add a expectedValue fn
      },
      {
        title: "From",
        button: SpeculosButton.RIGHT,
        // TODO: add a expectedValue fn
      },
      {
        title: "Fee",
        button: SpeculosButton.RIGHT,
        // TODO: add a expectedValue fn
      },
      {
        title: "Gas",
        button: SpeculosButton.RIGHT,
        // TODO: add a expectedValue fn
      },
      {
        title: "To",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Approve",
        button: SpeculosButton.BOTH,
      },
    ],
  });
