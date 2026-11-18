import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

const resources = {
  en: {
    translation: {
      history: {
        exportDialog: {
          title: "Export transaction history",
          disclaimer: "Estimated values only.",
          accountsToInclude: "Accounts to include",
          selectAll: "Select all ({{count}})",
          deselectAll: "Deselect all ({{count}})",
          export: "Export history",
          successTitle: "Transaction history saved successfully",
          successDescription: "The CSV file was saved.",
          done: "Done",
          errorTitle: "Something went wrong",
          errorDescription: "An error occurred.",
          tryAgain: "Try again",
        },
      },
    },
  },
};

export function I18nWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <I18nTestProvider resources={resources}>{children}</I18nTestProvider>;
}
