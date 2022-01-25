import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { deviceActionFlow } from "../../bot/specs";
import { perCoinLogic } from "./logic";
const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Amount",
      button: "Rr",
      ignoreAssertionFailure: true,
      // https://ledgerhq.atlassian.net/browse/LLC-676
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
      ignoreAssertionFailure: true,
      // https://ledgerhq.atlassian.net/browse/LLC-676
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
      expectedValue: ({ transaction, account }) => {
        const perCoin = perCoinLogic[account.currency.id];

        if (perCoin?.onScreenTransactionRecipient) {
          return perCoin.onScreenTransactionRecipient(transaction.recipient);
        }

        return transaction.recipient;
      },
    },
    {
      title: "Review",
      button: "Rr",
    },
    {
      title: "Confirm",
      button: "Rr",
    },
    {
      title: "Accept",
      button: "LRlr",
    },
    {
      title: "Approve",
      button: "LRlr",
    },
  ],
});
export default {
  acceptTransaction,
};
