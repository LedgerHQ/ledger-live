// @flow
import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "../../bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Review",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Withdraw",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Custom Delegate",
        button: SpeculosButton.RIGHT,
      },
      {
        // device sometimes know the text of a given delegator, we're not validating the actual text
        title: "Delegate",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Delegate Name",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Confirm",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => {
          return transaction.mode === "send" ? "Transaction" : "Delegation";
        },
      },
      {
        title: "Amount",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account, transaction }) =>
          formatDeviceAmount(account.currency, transaction.amount, {
            hideCode: true,
          }),
      },
      {
        title: "Fee",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account, status }) =>
          formatDeviceAmount(account.currency, status.estimatedFees, {
            hideCode: true,
          }),
      },
      {
        title: "Source",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account }) => account.freshAddress,
      },
      {
        title: "Destination",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Storage Limit",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) =>
          transaction.storageLimit?.toString() || "",
      },
      {
        title: "Reject",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Accept",
        button: SpeculosButton.BOTH,
      },
    ],
  });
