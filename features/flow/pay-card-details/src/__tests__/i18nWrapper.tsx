import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

export const CARD_COPY = {
  freeze: "Freeze",
  unfreeze: "Unfreeze",
  goBack: "Go back",
  freezeTitle: "Freezing means you cannot use the card anymore",
  freezeDescription: "You can unfreeze your card at any time.",
  freezeConfirm: "Freeze now",
  freezeErrorTitle: "Freeze failed",
  unfreezeTitle: "Unfreeze your card?",
  unfreezeConfirm: "Unfreeze now",
  unfreezeErrorTitle: "Unfreeze failed",
  errorDescription: "Something went wrong. Please try again.",
  retry: "Try again",
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
            errorTitle: CARD_COPY.freezeErrorTitle,
          },
          unfreezeConfirm: {
            title: CARD_COPY.unfreezeTitle,
            confirm: CARD_COPY.unfreezeConfirm,
            errorTitle: CARD_COPY.unfreezeErrorTitle,
          },
          confirmError: {
            description: CARD_COPY.errorDescription,
            retry: CARD_COPY.retry,
          },
        },
      },
    },
  },
};

export function I18nWrapper({ children }: { children: React.ReactNode }) {
  return <I18nTestProvider resources={CARD_RESOURCES}>{children}</I18nTestProvider>;
}
