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
      title: "Fees",
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
      title: "Address",
      button: "Rr",
      expectedValue: ({ transaction }) => transaction.recipient.replace(/ /g, ""),
    },
    {
      title: "Account",
      button: "Rr",
      expectedValue: ({ account }) => account.freshAddress.replace(/ /g, ""),
    },
    {
      title: "Destination Tag",
      button: "Rr",
      expectedValue: ({ transaction }) => String(transaction.tag),
    },
    {
      title: "Accept",
      button: "LRlr",
    },
  ],
});

export default { acceptTransaction };
