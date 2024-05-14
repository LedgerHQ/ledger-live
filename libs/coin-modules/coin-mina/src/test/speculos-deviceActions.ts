import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "../types/common";
import { deviceActionFlow, SpeculosButton } from "@ledgerhq/coin-framework/bot/specs";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/lib/currencies/formatCurrencyUnit";

export const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
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
          dynamicSignificantDigits: 10,
          staticSignificantDigits: 10,
        })}`,
    },
    {
      title: "Fee",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction, account }) =>
        `MINA ${formatCurrencyUnit(account.currency.units[0], transaction.fees.fee, {
          dynamicSignificantDigits: 10,
          staticSignificantDigits: 10,
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
            dynamicSignificantDigits: 10,
            staticSignificantDigits: 10,
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
