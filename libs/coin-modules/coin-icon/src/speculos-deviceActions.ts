import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { deviceActionFlow, SpeculosButton } from "@ledgerhq/coin-framework/bot/specs";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/index";

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
