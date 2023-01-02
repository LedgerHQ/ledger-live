import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "../../bot/specs";
import { perCoinLogic } from "./logic";

export const opReturnFlow: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
      ignoreAssertionFailure: true,
      expectedValue: ({ account, status }) => {
        return formatDeviceAmount(account.currency, status.amount);
      },
    },
    {
      title: "Address",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction, account }, acc) => {
        const perCoin = perCoinLogic[account.currency.id];

        // if there's already one "Address" step done it means we are on the OP_RETURN step
        if (acc.find((step) => step.title === "Address")) {
          return `OP_RETURN ${transaction.opReturnData?.toString("hex")}`;
        }

        if (perCoin?.onScreenTransactionRecipient) {
          return perCoin.onScreenTransactionRecipient(transaction.recipient);
        }

        return transaction.recipient;
      },
    },
    {
      title: "Fees",
      button: SpeculosButton.RIGHT,
      ignoreAssertionFailure: true,
      expectedValue: ({ account, status }) =>
        formatDeviceAmount(account.currency, status.estimatedFees),
    },
    {
      title: "Review",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Confirm",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Accept",
      button: SpeculosButton.BOTH,
    },
    {
      title: "Approve",
      button: SpeculosButton.BOTH,
    },
  ],
});
