import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

export const CARD_ASSETS_COPY = {
  title: "Assets",
  empty: "No assets yet",
  error: "Couldn't load assets",
  topUp: "Top up",
  withdraw: "Withdraw",
  transactions: "Transactions",
  withdrawTitle: "You'll be redirected to Baanx",
  withdrawDescription: "Withdraw funds from your Baanx account to your Ledger wallet address.",
  continue: "Continue",
} as const;

export const CARD_ASSETS_RESOURCES = {
  en: {
    translation: {
      payTab: {
        card: {
          assets: {
            title: CARD_ASSETS_COPY.title,
            empty: CARD_ASSETS_COPY.empty,
            error: CARD_ASSETS_COPY.error,
            details: {
              topUp: CARD_ASSETS_COPY.topUp,
              withdraw: CARD_ASSETS_COPY.withdraw,
              transactions: CARD_ASSETS_COPY.transactions,
            },
            withdraw: {
              title: CARD_ASSETS_COPY.withdrawTitle,
              description: CARD_ASSETS_COPY.withdrawDescription,
              continue: CARD_ASSETS_COPY.continue,
            },
          },
        },
        cardTransactions: {
          categories: { MISC: "Other" },
          history: {
            columns: {
              transaction: "Transaction",
              fundingSources: "Cashback",
              amount: "Amount",
            },
          },
        },
      },
    },
  },
};

export function I18nWrapper({ children }: { children: React.ReactNode }) {
  return <I18nTestProvider resources={CARD_ASSETS_RESOURCES}>{children}</I18nTestProvider>;
}
