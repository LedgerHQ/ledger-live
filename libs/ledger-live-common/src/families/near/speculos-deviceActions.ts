import * as nearAPI from "near-api-js";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow } from "../../bot/specs";
const confirmWording = {
  send: "transfer",
  stake: "deposit_and_stake",
  unstake: "unstake",
  withdraw: "withdraw",
};

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Confirm",
        button: "Rr",
        expectedValue: ({ transaction }) => confirmWording[transaction.mode],
      },
      {
        title: "Deposit",
        button: "Rr",
        expectedValue: ({ transaction, account }) => {
          if (transaction.mode === "stake") {
            return formatCurrencyUnit(
              getAccountUnit(account),
              transaction.amount,
              {
                disableRounding: true,
              }
            );
          }

          return "0";
        },
      },
      {
        title: "Amount",
        button: "Rr",
        expectedValue: ({ transaction, account }) =>
          formatCurrencyUnit(getAccountUnit(account), transaction.amount, {
            disableRounding: true,
          }),
      },
      {
        title: "To",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "From",
        button: "Rr",
        expectedValue: ({ account }) => account.freshAddress,
      },
      {
        title: "Args",
        button: "Rr",
        expectedValue: ({ transaction, account }) => {
          if (transaction.mode === "stake") {
            return "{}";
          }

          return JSON.stringify({
            amount: nearAPI.utils.format.parseNearAmount(
              formatCurrencyUnit(getAccountUnit(account), transaction.amount, {
                disableRounding: true,
              })
            ),
          });
        },
      },
      {
        title: "Approve",
        button: "LRlr",
        final: true,
      },
    ],
  });
