import * as nearAPI from "near-api-js";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, SpeculosButton } from "@ledgerhq/coin-framework/bot/specs";
const confirmWording: Record<string, string> = {
  send: "transfer",
  stake: "deposit_and_stake",
  unstake: "unstake",
  withdraw: "withdraw",
};

export const stakeTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
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
          return formatCurrencyUnit(getAccountCurrency(account).units[0], transaction.amount, {
            disableRounding: true,
          });
        }

        return "0";
      },
    },
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction, account }) =>
        formatCurrencyUnit(getAccountCurrency(account).units[0], transaction.amount, {
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
            formatCurrencyUnit(getAccountCurrency(account).units[0], transaction.amount, {
              disableRounding: true,
            }),
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

export const sendTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "View header",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Signer Id (1/2)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Signer Id (2/2)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Receiver Id (1/2)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Receiver Id (2/2)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Total actions",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Continue to actions",
      button: SpeculosButton.BOTH,
    },
    {
      title: "Total actions",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "View action 1/1",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Action type",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Sign",
      button: SpeculosButton.BOTH,
    },
  ],
});
