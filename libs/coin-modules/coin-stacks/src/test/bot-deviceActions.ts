import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "../types";
import { deviceActionFlow, SpeculosButton } from "@ledgerhq/coin-framework/bot/specs";
import { getSubAccount } from "../bridge/utils/token";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/lib/currencies/formatCurrencyUnit";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import invariant from "invariant";

export const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Please",
      button: SpeculosButton.RIGHT,
      expectedValue: () => "review",
    },
    {
      title: "Origin",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "Nonce",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => (transaction.nonce ? transaction.nonce.toFixed() : "0"),
    },
    {
      title: "Fee (uSTX)",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => (transaction.fee ? transaction.fee.toFixed() : "0"),
    },
    {
      title: "Amount uSTX",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ status }) => status.amount.toFixed(),
    },
    {
      title: "To",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Memo",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.memo || "",
    },
    {
      title: "APPROVE",
      button: SpeculosButton.BOTH,
    },
  ],
});

export const acceptTokenTransfer: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Please",
      button: SpeculosButton.RIGHT,
      expectedValue: () => "review",
    },
    {
      title: "Origin",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "Nonce",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => (transaction.nonce ? transaction.nonce.toFixed() : "0"),
    },
    {
      title: "Fee (uSTX)",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => (transaction.fee ? transaction.fee.toFixed() : "0"),
    },
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
      expectedValue: async ({ transaction, status, account }) => {
        const subAccount = getSubAccount(account, transaction);
        invariant(subAccount, "subAccount not found");

        const token = await getCryptoAssetsStore().findTokenById(subAccount.token.id);
        if (!token) {
          throw new Error("Token not found");
        }

        const formattedAmount = formatCurrencyUnit(token.units[0], status.amount);
        return `${formattedAmount} (${token.ticker})`;
      },
    },
    {
      title: "From",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "To",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Memo",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => (transaction.memo ? "Complex memo value" : "None"),
    },
    {
      title: "APPROVE",
      button: SpeculosButton.BOTH,
    },
  ],
});
