import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "./types";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "@ledgerhq/coin-framework/bot/specs";
import { State } from "@ledgerhq/coin-framework/bot/types";

export const acceptTransaction: DeviceAction<Transaction, State<Transaction>> = deviceActionFlow({
  steps: [
    {
      title: "Transaction Type",
      button: SpeculosButton.RIGHT,
      expectedValue: () => "Payment",
    },
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account, status }) => formatDeviceAmount(account.currency, status.amount),
    },
    {
      title: "Fee",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account, status }) =>
        formatDeviceAmount(account.currency, status.estimatedFees),
    },
    {
      title: "Sign transaction",
      button: SpeculosButton.BOTH,
    },
  ],
});
