import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { deviceActionFlow } from "../../bot/specs";

const expectedAmount = ({ account, status }) =>
  formatCurrencyUnit(account.unit, status.amount, {
    disableRounding: true,
    useGrouping: false,
  }) + " XLM";

const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Starting Balance",
      button: "Rr",
      expectedValue: expectedAmount,
    },
    {
      title: "Send",
      button: "Rr",
      expectedValue: expectedAmount,
    },
    {
      title: "Fee",
      button: "Rr",
      expectedValue: ({ account, status }) =>
        formatCurrencyUnit(account.unit, status.estimatedFees, {
          disableRounding: true,
        }) + " XLM",
    },
    {
      title: "Destination",
      button: "Rr",
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Create Account",
      button: "Rr",
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Memo",
      button: "Rr",
      expectedValue: ({ transaction }) => transaction.memoValue || "[none]",
    },
    {
      title: "Network",
      button: "Rr",
      expectedValue: () => "Public",
    },
    {
      title: "Time Bounds",
      button: "Rr",
    },
    {
      title: "Tx Source",
      button: "Rr",
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "Review",
      button: "Rr",
    },
    {
      title: "Finalize",
      button: "LRlr",
    },
  ],
});
export default {
  acceptTransaction,
};
