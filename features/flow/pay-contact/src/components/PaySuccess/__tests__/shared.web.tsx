import React, { type ReactElement } from "react";
import { render } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style";
import { I18nTestProvider, type I18nTestProviderProps } from "@shared/i18n/testing";

export const PAY_SUCCESS_RESOURCES: I18nTestProviderProps["resources"] = {
  en: {
    translation: {
      payTab: {
        contacts: {
          paySuccess: {
            title: "You paid ({{recipient}}) {{amount}}",
            amount: "Amount",
            estimatedTime: "Est. time",
            from: "From",
            viewTransaction: "View transaction",
            close: "Close",
          },
        },
      },
    },
  },
};

export function renderPaySuccess(ui: ReactElement) {
  return render(
    <I18nTestProvider resources={PAY_SUCCESS_RESOURCES}>
      <StyleProvider colorScheme="dark">{ui}</StyleProvider>
    </I18nTestProvider>,
  );
}
