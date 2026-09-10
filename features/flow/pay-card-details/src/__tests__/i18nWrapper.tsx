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
  placeholder: "Coming soon",
  details: "Details",
  numbersReveal: "View",
  numbersHide: "Hide",
  numbersFailed: "Couldn't load card numbers",
  numbersImageAlt: "Card numbers",
} as const;

export const MORE_COPY = {
  tile: "More",
  title: "More",
  rows: {
    managePin: "Manage PIN Code",
    accessBaanx: "Access to Baanx",
    help: "Help",
    logout: "Logout",
  },
} as const;

export const CARD_RESOURCES = {
  en: {
    translation: {
      payTab: {
        card: {
          freeze: CARD_COPY.freeze,
          unfreeze: CARD_COPY.unfreeze,
          goBack: CARD_COPY.goBack,
          placeholder: CARD_COPY.placeholder,
          details: CARD_COPY.details,
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
          numbers: {
            reveal: CARD_COPY.numbersReveal,
            hide: CARD_COPY.numbersHide,
            failed: CARD_COPY.numbersFailed,
            imageAlt: CARD_COPY.numbersImageAlt,
          },
        },
        cardMore: {
          tile: MORE_COPY.tile,
          title: MORE_COPY.title,
          rows: MORE_COPY.rows,
        },
      },
    },
  },
};

export function I18nWrapper({ children }: { children: React.ReactNode }) {
  return <I18nTestProvider resources={CARD_RESOURCES}>{children}</I18nTestProvider>;
}
