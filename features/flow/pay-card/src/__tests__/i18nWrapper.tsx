import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

export const CARD_TITLE = "Crypto card";

const CARD_RESOURCES = {
  en: {
    translation: {
      payTab: {
        card: {
          title: CARD_TITLE,
          balanceLabel: "Balance",
        },
      },
    },
  },
};

export function I18nWrapper({ children }: { children: React.ReactNode }) {
  return <I18nTestProvider resources={CARD_RESOURCES}>{children}</I18nTestProvider>;
}
