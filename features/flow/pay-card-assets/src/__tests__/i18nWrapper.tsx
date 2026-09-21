import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

export const CARD_ASSETS_COPY = {
  title: "Assets",
  info: "These assets fund your card. Set the order they're charged in, or add more.",
  manage: "Manage",
  empty: "No assets yet",
  error: "Couldn't load assets",
  topUp: "Top up",
  withdraw: "Withdraw",
  transactions: "Transactions",
  transactionsEmpty: "No card transactions yet",
  withdrawTitle: "You'll be redirected to Baanx",
  withdrawDescription: "Withdraw funds from your Baanx account to your Ledger wallet address.",
  continue: "Continue",
  manageDialogTitle: "Manage assets",
  manageDialogDescription:
    "Your assets are listed in funding order. If one asset runs low, the next one is used automatically.",
  addAssetCaption: "You'll be redirected to Baanx's page to add asset.",
  addAsset: "Add asset",
} as const;

export const CARD_ASSETS_RESOURCES = {
  en: {
    translation: {
      payTab: {
        card: {
          assets: {
            title: CARD_ASSETS_COPY.title,
            info: CARD_ASSETS_COPY.info,
            manage: CARD_ASSETS_COPY.manage,
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
            manageDialog: {
              title: CARD_ASSETS_COPY.manageDialogTitle,
              description: CARD_ASSETS_COPY.manageDialogDescription,
              addAssetCaption: CARD_ASSETS_COPY.addAssetCaption,
              addAsset: CARD_ASSETS_COPY.addAsset,
            },
          },
        },
        cardTransactions: {
          categories: { MISC: "Other" },
          history: {
            empty: {
              title: CARD_ASSETS_COPY.transactionsEmpty,
            },
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
