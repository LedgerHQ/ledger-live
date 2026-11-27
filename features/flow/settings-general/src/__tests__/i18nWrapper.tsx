import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

const resources = {
  en: {
    translation: {
      settings: {
        general: {
          ledgerSync: {
            title: "Ledger Sync",
            description: "Keep your wallet up to date on all your devices",
            manage: "Manage",
            activate: "Sync",
          },
          theme: {
            title: "Theme",
            description: "Select your app theme",
            options: { system: "System", light: "Light", dark: "Dark" },
          },
          language: { title: "Language", description: "Select the app language" },
          region: {
            title: "Region",
            description: "Select the format of dates, times and numbers",
            dialogTitle: "Select your region",
            dialogDescription: "Choose region to update formats of dates, time and currencies",
          },
          currency: { title: "Currency", description: "Select the currency displayed in the app" },
          search: { placeholder: "Search", emptyLabel: "No results" },
        },
      },
    },
  },
};

export function I18nWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <I18nTestProvider resources={resources}>{children}</I18nTestProvider>;
}
