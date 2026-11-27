import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

const resources = {
  en: {
    translation: {
      settings: {
        assetManagement: {
          hideEmptyTokenAccounts: {
            title: "Hide empty token accounts",
            description: "Hide token accounts with zero balance.",
          },
          filterTokenOperationsZeroAmount: {
            title: "Hide token transactions when value is 0",
            description:
              "Hiding token transactions without value can prevent some potential address poisoning attacks on Eth, Polygon, BSC, Tron...",
          },
          hiddenTokens: {
            title: "Hidden tokens",
            description:
              "You can hide tokens by going to the parent account then right-clicking on the token and selecting 'Hide token'.",
            manage: "Manage",
            sheetTitle: "Hidden tokens",
            sheetDescription: "Select a token to display it in Ledger Wallet",
            empty: "You have no hidden tokens.",
            showToken: "Show {{token}}",
          },
        },
      },
    },
  },
};

export function I18nWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <I18nTestProvider resources={resources}>{children}</I18nTestProvider>;
}
