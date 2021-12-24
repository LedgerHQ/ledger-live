// @flow
import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { deviceActionFlow } from "../../bot/specs";

const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Review",
      button: "Rr",
    },
    {
      title: "Withdraw",
      button: "Rr",
    },
    {
      title: "Custom Delegate",
      button: "Rr",
    },
    {
      // device sometimes know the text of a given delegator, we're not validating the actual text
      title: "Delegate",
      button: "Rr",
    },
    {
      title: "Delegate Name",
      button: "Rr",
    },
    {
      title: "Confirm",
      button: "Rr",
      expectedValue: ({ transaction }) => {
        return transaction.mode === "send" ? "Transaction" : "Delegation";
      },
    },
    {
      title: "Amount",
      button: "Rr",
      expectedValue: ({ account, transaction }) => {
        const amount = transaction.amount;
        return formatCurrencyUnit(account.unit, amount, {
          disableRounding: true,
          joinFragmentsSeparator: " ",
        }).replace(/\s/g, " ");
      },
    },
    {
      title: "Fee",
      button: "Rr",
      expectedValue: ({ account, status }) => {
        const amount = status.estimatedFees;
        return formatCurrencyUnit(account.currency.units[0], amount, {
          disableRounding: true,
          joinFragmentsSeparator: " ",
        }).replace(/\s/g, " ");
      },
    },
    {
      title: "Source",
      button: "Rr",
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "Destination",
      button: "Rr",
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Storage Limit",
      button: "Rr",
      expectedValue: ({ transaction }) =>
        transaction.storageLimit?.toString() || "",
    },
    {
      title: "Reject",
      button: "Rr",
    },
    {
      title: "Accept",
      button: "LRlr",
    },
  ],
});

export default { acceptTransaction };
