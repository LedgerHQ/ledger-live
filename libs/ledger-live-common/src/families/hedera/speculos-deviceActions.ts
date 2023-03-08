import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { deviceActionFlow, SpeculosButton } from "../../bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Transfer",
      },
      {
        title: "with Key #0?",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Operator",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account }) => account.freshAddress,
      },
      {
        title: "Sender",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account }) => account.freshAddress,
      },
      {
        title: "Recipient",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Amount",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account: { unit }, status: { amount } }) => {
          return (
            formatCurrencyUnit(unit, amount, {
              disableRounding: true,
              showAllDigits: true,
            }) + " hbar"
          );
        },
      },
      {
        title: "Fee",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account: { unit }, status: { estimatedFees } }) =>
          formatCurrencyUnit(unit, estimatedFees, {
            disableRounding: true,
            showAllDigits: true,
          }) + " hbar",
      },
      {
        title: "Max Fee",
        button: SpeculosButton.RIGHT,
        expectedValue: () => "1 hbar",
      },
      {
        title: "Memo",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.memo as string,
      },
      {
        title: "Confirm",
        button: SpeculosButton.BOTH,
      },
    ],
  });
