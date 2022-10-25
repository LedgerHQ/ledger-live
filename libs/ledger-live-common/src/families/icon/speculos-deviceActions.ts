import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { deviceActionFlow } from "../../bot/specs";

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
        button: "Rr",
      },
      {
        title: "Amount",
        button: "Rr",
        expectedValue: expectedAmount,
      },
      {
        title: "Address",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          return transaction.recipient;
        },
      },
      {
        title: "Fees",
        button: "Rr",
        expectedValue: ({ account, status }) =>
          formatCurrencyUnit(account.unit, status.estimatedFees, {
            disableRounding: true,
          }),
      },
      {
        title: "Accept",
        button: "LRlr",
      },
    ],
  });
