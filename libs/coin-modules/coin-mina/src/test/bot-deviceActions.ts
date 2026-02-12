import { deviceActionFlow, SpeculosButton } from "@ledgerhq/coin-framework/bot/specs";
import type { DeviceAction, State } from "@ledgerhq/coin-framework/bot/types";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/lib/currencies/formatCurrencyUnit";
import type { Transaction } from "../types/common";

export const acceptTransaction: DeviceAction<Transaction, State<Transaction>> = deviceActionFlow({
  steps: [
    {
      title: "Sign",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Type",
      button: SpeculosButton.RIGHT,
      expectedValue: () => "Payment",
    },
    {
      title: "Sender",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "Receiver",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction, account }) =>
        `MINA ${formatCurrencyUnit(account.currency.units[0], transaction.amount, {
          dynamicSignificantDigits: 11,
          staticSignificantDigits: 11,
        })}`,
    },
    {
      title: "Fee",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction, account }) =>
        `MINA ${formatCurrencyUnit(account.currency.units[0], transaction.fees.fee, {
          dynamicSignificantDigits: 11,
          staticSignificantDigits: 11,
        })}`,
    },
    {
      title: "Total",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction, account }) =>
        `MINA ${formatCurrencyUnit(
          account.currency.units[0],
          transaction.fees.fee.plus(transaction.amount),
          {
            dynamicSignificantDigits: 11,
            staticSignificantDigits: 11,
          },
        )}`,
    },
    {
      title: "Memo",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.memo ?? "",
    },
    {
      title: "Nonce",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.nonce.toString(),
    },
    {
      title: "Approve",
      button: SpeculosButton.BOTH,
    },
  ],
});
