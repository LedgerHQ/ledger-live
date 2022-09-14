import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, formatDeviceAmount } from "../../bot/specs";
import { perCoinLogic } from "./logic";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Amount",
        button: "Rr",
        ignoreAssertionFailure: true,
        expectedValue: ({ account, status }) =>
          formatDeviceAmount(account.currency, status.amount),
      },
      {
        title: "Fees",
        button: "Rr",
        ignoreAssertionFailure: true,
        expectedValue: ({ account, status }) =>
          formatDeviceAmount(account.currency, status.estimatedFees),
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
