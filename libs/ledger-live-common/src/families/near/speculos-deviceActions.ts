import * as nearAPI from "near-api-js";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, SpeculosButton } from "../../bot/specs";
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
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => confirmWording[transaction.mode],
      },
      {
        title: "Deposit",
        button: SpeculosButton.RIGHT,
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
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction, account }) =>
          formatCurrencyUnit(getAccountUnit(account), transaction.amount, {
            disableRounding: true,
          }),
      },
      {
        title: "To",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "From",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account }) => account.freshAddress,
      },
      {
        title: "Args",
        button: SpeculosButton.RIGHT,
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
        button: SpeculosButton.BOTH,
        final: true,
      },
    ],
  });
