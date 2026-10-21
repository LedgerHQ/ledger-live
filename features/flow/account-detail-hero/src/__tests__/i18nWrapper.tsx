import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

const resources = {
  en: {
    translation: {
      accountDetailHero: {
        actions: {
          transfer: "Transfer",
          receive: "Receive",
          send: "Send",
          swap: "Swap",
          buy: "Buy",
          sell: "Sell",
          earn: "Earn",
          more: "More",
        },
      },
    },
  },
};

export function I18nWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <I18nTestProvider resources={resources}>{children}</I18nTestProvider>;
}
