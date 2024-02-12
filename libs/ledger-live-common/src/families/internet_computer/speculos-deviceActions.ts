import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, formatDeviceAmount, SpeculosButton } from "../../bot/specs";
import { methodToString } from "./utils";

const ignoreSpaces = (s: string) => s.replace(/ /g, "");

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
      stepValueTransform: ignoreSpaces,
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "To account",
      button: SpeculosButton.RIGHT,
      stepValueTransform: ignoreSpaces,
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Amount (ICP)",
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
