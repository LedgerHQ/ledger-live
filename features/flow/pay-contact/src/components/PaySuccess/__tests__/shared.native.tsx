import React, { type ReactElement } from "react";
import { render } from "@testing-library/react-native";
import { I18nTestProvider, type I18nTestProviderProps } from "@shared/i18n/testing";

export const PAY_SUCCESS_RESOURCES: I18nTestProviderProps["resources"] = {
  en: {
    translation: {
      payTab: {
        contacts: {
          paySuccess: {
            title: "You paid ({{recipient}})",
            viewTransaction: "View transaction",
            close: "Close",
          },
        },
      },
    },
  },
};

export function renderPaySuccess(ui: ReactElement) {
  return render(<I18nTestProvider resources={PAY_SUCCESS_RESOURCES}>{ui}</I18nTestProvider>);
}
