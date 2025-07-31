import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "../types";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "@ledgerhq/coin-framework/bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
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
      title: "Destination",
      button: SpeculosButton.RIGHT,
      trimValue: true,
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Account",
      button: SpeculosButton.RIGHT,
      trimValue: true,
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "Accept",
      button: SpeculosButton.BOTH,
    },
    {
      title: "Sign transaction",
      button: SpeculosButton.BOTH,
    },
  ],
});
