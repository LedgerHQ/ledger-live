import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { deviceActionFlow } from "../../bot/specs";
import { CryptoCurrency, getCryptoCurrencyById } from "@ledgerhq/cryptoassets";

function getMainCurrency(currency: CryptoCurrency) {
  if (currency.isTestnetFor !== undefined) {
    return getCryptoCurrencyById(currency.isTestnetFor);
  }
  return currency;
}

function ellipsis(str: string) {
  return `${str.slice(0, 7)}..${str.slice(-7)}`;
}

export const acceptTransferTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Transfer",
        button: "Rr",
        expectedValue: ({ account, status }) =>
          formatCurrencyUnit(
            getMainCurrency(account.currency).units[0],
            status.amount,
            {
              disableRounding: true,
              showCode: true,
            }
          ).replace(/\s/g, " "),
      },
      {
        title: "Sender",
        button: "Rr",
        expectedValue: ({ account }) => ellipsis(account.freshAddress),
      },
      {
        title: "Recipient",
        button: "Rr",
        expectedValue: ({ transaction }) => ellipsis(transaction.recipient),
      },
      {
        title: "Fee payer",
        button: "Rr",
        expectedValue: () => "sender",
      },
      {
        title: "Approve",
        button: "LRlr",
        final: true,
      },
    ],
  });

export default {
  acceptTransferTransaction,
};
