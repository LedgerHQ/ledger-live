import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import { deviceActionFlow, SpeculosButton } from "@ledgerhq/ledger-wallet-framework/bot/specs";
import type { DeviceAction } from "@ledgerhq/ledger-wallet-framework/bot/types";
import * as nearAPI from "near-api-js";
import type { Transaction } from "./types";
const confirmWording: Record<string, string> = {
  send: "transfer",
  stake: "deposit_and_stake",
  unstake: "unstake",
  withdraw: "withdraw",
};

export const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
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
