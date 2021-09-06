import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow } from "../../bot/specs";
import { formatCurrencyUnit } from "../../currencies";
const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Receiver",
      button: "RRRRrrrr",
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Amount",
      button: "Rr",
      expectedValue: ({ account, transaction }) => {
        const formattedValue =
          formatCurrencyUnit(account.unit, transaction.amount, {
            disableRounding: true,
          }) + " EGLD";

        if (!formattedValue.includes(".")) {
          // if the value is pure integer, in the app it will automatically add an .0
          return formattedValue + ".0";
        }

        return formattedValue;
      },
    },
    {
      title: "Fee",
      button: "Rr",
      // TODO: add a expectedValue fn
    },
    {
      title: "Data",
      button: "Rr",
    },
    {
      title: "Sign",
      button: "LRlr",
    },
  ],
});
export default {
  acceptTransaction,
};
