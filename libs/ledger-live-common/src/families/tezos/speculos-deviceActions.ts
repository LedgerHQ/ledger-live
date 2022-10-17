// @flow
import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, formatDeviceAmount } from "../../bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
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
        expectedValue: ({ account, transaction }) =>
          formatDeviceAmount(account.currency, transaction.amount, {
            hideCode: true,
          }),
      },
      {
        title: "Fee",
        button: "Rr",
        expectedValue: ({ account, status }) =>
          formatDeviceAmount(account.currency, status.estimatedFees, {
            hideCode: true,
          }),
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
