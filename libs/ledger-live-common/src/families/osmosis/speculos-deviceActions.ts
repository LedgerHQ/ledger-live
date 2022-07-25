import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow } from "../../bot/specs";

const typeWording = {
  send: "Send",
};

const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Chain ID",
      button: "Rr",
    },
    {
      title: "Account",
      button: "Rr",
    },
    {
      title: "Sequence",
      button: "Rr",
    },
    {
      title: "Type",
      button: "Rr",
      expectedValue: ({ transaction }) => typeWording[transaction.mode],
    },
    {
      title: "Amount",
      button: "Rr",
      expectedValue: ({ account, status }) => {
        const denom = account.currency.units[1].code;
        const amount = status.amount.toString();
        return `${amount} ${denom}`;
      },
    },
    {
      title: "From",
      button: "Rr",
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "To",
      button: "Rr",
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Memo",
      button: "Rr",
      expectedValue: ({ transaction }) => transaction.memo || "",
    },
    {
      title: "Fee",
      button: "Rr",
      expectedValue: ({ account, status }) => {
        const denom = account.currency.units[1].code;
        const amount = status.estimatedFees.toString();
        return `${amount} ${denom}`;
      },
    },
    {
      title: "Gas",
      button: "Rr",
      expectedValue: ({ transaction }) => transaction.gas?.toString() || "",
    },
    {
      title: "APPROVE",
      button: "LRlr",
      final: true,
    },
  ],
});
export default {
  acceptTransaction,
};
