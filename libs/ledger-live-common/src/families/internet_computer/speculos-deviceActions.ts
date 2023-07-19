import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, formatDeviceAmount, SpeculosButton } from "../../bot/specs";
import { methodToString } from "./utils";

export const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Transaction type",
      button: SpeculosButton.RIGHT,
      expectedValue: () => {
        return methodToString(0);
      },
    },
    {
      title: "From account",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) => account.freshAddress.match(/.{1,8}/g)?.join(" ") ?? "",
    },
    {
      title: "To account",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.recipient.match(/.{1,8}/g)?.join(" ") ?? "",
    },
    {
      title: "Payment (ICP)",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ status, account }) =>
        formatDeviceAmount(account.currency, status.amount, {
          hideCode: true,
          showAllDigits: false,
        }),
    },
    {
      title: "Maximum fee (ICP)",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ status, account }) =>
        formatDeviceAmount(account.currency, status.estimatedFees, {
          hideCode: true,
          showAllDigits: false,
        }),
    },
    {
      title: "Memo",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.memo ?? "0",
    },
    {
      title: "APPROVE",
      button: SpeculosButton.BOTH,
    },
  ],
});
