import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

export const CARD_ASSETS_COPY = {
  title: "Assets",
  empty: "No assets yet",
  error: "Couldn't load assets",
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
          },
        },
      },
    },
  },
};

export function I18nWrapper({ children }: { children: React.ReactNode }) {
  return <I18nTestProvider resources={CARD_ASSETS_RESOURCES}>{children}</I18nTestProvider>;
}
