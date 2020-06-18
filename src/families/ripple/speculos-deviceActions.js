// @flow
import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { deviceActionFlow } from "../../bot/specs";

const acceptTransaction: DeviceAction<Transaction, *> = deviceActionFlow({
  steps: [
    {
      title: "Transaction Type",
      button: "Rr",
      expectedValue: () => "Payment",
    },
    {
      title: "Amount",
      button: "Rr",
      expectedValue: ({ account, status }) =>
        formatCurrencyUnit(
          {
            ...account.unit,
            code: account.currency.deviceTicker || account.unit.code,
          },
          status.amount,
          {
            showCode: true,
            disableRounding: true,
          }
        ).replace(/\s/g, " "),
    },
    {
      title: "Fee",
      button: "Rr",
      expectedValue: ({ account, status }) =>
        formatCurrencyUnit(
          {
            ...account.unit,
            code: account.currency.deviceTicker || account.unit.code,
          },
          status.estimatedFees,
          {
            showCode: true,
            disableRounding: true,
          }
        ).replace(/\s/g, " "),
    },
    {
      title: "Destination Tag",
      button: "Rr",
      expectedValue: ({ transaction }) => String(transaction.tag),
    },
    {
      title: "Destination",
      button: "Rr",
      trimValue: true,
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Account",
      button: "Rr",
      trimValue: true,
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "Accept",
      button: "LRlr",
    },
    {
      title: "Sign transaction",
      button: "LRlr",
    },
  ],
});

export default { acceptTransaction };
