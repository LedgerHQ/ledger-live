import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, SpeculosButton } from "@ledgerhq/coin-framework/bot/specs";
 
export const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Transfer",
      button: SpeculosButton.RIGHT,
      expectedValue: () => "KDA",
    },
    {
      title: "From (1/5)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "From (2/5)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "From (3/5)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "From (4/5)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "From (5/5)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "To (1/5)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "To (2/5)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "To (3/5)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "To (4/5)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "To (5/5)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Gas Limit (1/2)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Gas Price (2/2)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Sign Transaction",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Reject",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Confirm",
      button: SpeculosButton.BOTH,
    },
  ],
});