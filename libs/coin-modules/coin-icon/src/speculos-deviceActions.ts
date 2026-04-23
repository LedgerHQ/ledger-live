import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import { deviceActionFlow, SpeculosButton } from "@ledgerhq/ledger-wallet-framework/bot/specs";
import type { DeviceAction } from "@ledgerhq/ledger-wallet-framework/bot/types";
import type { Transaction } from "./types";

const confirmWording: Record<string, string> = {
  send: "transfer",
};

export const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Confirm",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => confirmWording[transaction.mode],
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
      title: "Address",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => {
        return transaction.recipient;
      },
    },
    {
      title: "Fees",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account, status }) =>
        formatCurrencyUnit(getAccountCurrency(account).units[0], status.estimatedFees, {
          disableRounding: true,
        }),
    },
    {
      title: "Accept",
      button: SpeculosButton.BOTH,
    },
  ],
});
