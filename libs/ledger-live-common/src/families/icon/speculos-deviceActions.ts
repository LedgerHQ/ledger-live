import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { deviceActionFlow, SpeculosButton } from "../../bot/specs";

const expectedAmount = ({ account, status }) => {
  return (
    "ICX " +
    formatCurrencyUnit(account.unit, status.amount, {
      disableRounding: true,
    })
  );
};

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Confirm",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Amount",
        button: SpeculosButton.RIGHT,
        expectedValue: expectedAmount,
      },
      {
        title: "Address",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => {
          return transaction.recipient;
        },
      },
      {
        title: "Fees",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account, status }) =>
          formatCurrencyUnit(account.unit, status.estimatedFees, {
            disableRounding: true,
          }),
      },
      {
        title: "Accept",
        button: SpeculosButton.BOTH,
      },
    ],
  });
