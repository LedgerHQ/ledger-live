import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

export const CARD_COPY = {
  freeze: "Freeze",
  unfreeze: "Unfreeze",
  goBack: "Go back",
  freezeTitle: "Freezing means you cannot use the card anymore",
  freezeDescription: "You can unfreeze your card at any time.",
  freezeConfirm: "Freeze now",
  unfreezeTitle: "Unfreeze your card?",
  unfreezeConfirm: "Unfreeze now",
} as const;

export const CARD_RESOURCES = {
  en: {
    translation: {
      payTab: {
        card: {
          freeze: CARD_COPY.freeze,
          unfreeze: CARD_COPY.unfreeze,
          goBack: CARD_COPY.goBack,
          freezeConfirm: {
            title: CARD_COPY.freezeTitle,
            description: CARD_COPY.freezeDescription,
            confirm: CARD_COPY.freezeConfirm,
          },
          unfreezeConfirm: {
            title: CARD_COPY.unfreezeTitle,
            confirm: CARD_COPY.unfreezeConfirm,
          },
        },
      },
    },
  },
};

export function I18nWrapper({ children }: { children: React.ReactNode }) {
  return <I18nTestProvider resources={CARD_RESOURCES}>{children}</I18nTestProvider>;
}
