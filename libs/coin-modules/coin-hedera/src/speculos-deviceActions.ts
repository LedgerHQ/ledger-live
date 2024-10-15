import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { deviceActionFlow, SpeculosButton } from "@ledgerhq/coin-framework/bot/specs";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/index";

export const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Transfer",
    },
    {
      title: "with Key #0?",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Operator",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "Sender",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "Recipient",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account, status: { amount } }) => {
        return (
          formatCurrencyUnit(getAccountCurrency(account).units[0], amount, {
            disableRounding: true,
            showAllDigits: true,
          }) + " hbar"
        );
      },
    },
    {
      title: "Fee",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account, status: { estimatedFees } }) =>
        formatCurrencyUnit(getAccountCurrency(account).units[0], estimatedFees, {
          disableRounding: true,
          showAllDigits: true,
        }) + " hbar",
    },
    {
      title: "Max Fee",
      button: SpeculosButton.RIGHT,
      expectedValue: () => "1 hbar",
    },
    {
      title: "Memo",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.memo as string,
    },
    {
      title: "Confirm",
      button: SpeculosButton.BOTH,
    },
  ],
});
