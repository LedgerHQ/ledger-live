import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "@ledgerhq/coin-framework/bot/specs";
import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "../types";

export const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
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
      title: "Operation (0)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Operation (1)",
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
          postfixCode: true,
        }),
    },
    /**
     * when revealing, fee are print twice on nano side.
     * we ignore the assertion failure because we can't know if it's the first or second fee
     * status.estimatedFees is the total fees, so we can't use it
     */
    {
      title: "Fee",
      button: SpeculosButton.RIGHT,
      ignoreAssertionFailure: true,
      expectedValue: ({ account, status }) =>
        formatDeviceAmount(account.currency, status.estimatedFees, {
          postfixCode: true,
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
      title: "Public key",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Storage limit",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }, prevSteps) => {
        if (
          prevSteps.some(step => step.title === "Operation (0)" && step.value === "Reveal") &&
          !prevSteps.some(step => step.title === "Operation (1)")
        ) {
          return "0";
        }
        return transaction.storageLimit?.toString() || "";
      },
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
