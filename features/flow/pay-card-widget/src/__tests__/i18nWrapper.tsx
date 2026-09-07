import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

export const CARD_ONBOARDING_COPY = {
  widgetTitle: "Set up your card",
  widgetAllDone: "You're all set",
  dialogTitle: "Complete your card",
  stepComplete: "Completed",
  gotIt: "Got it",
  walletStepTitle: "Add to Apple/Google Pay",
  walletStepDescription: "Pay with your phone in store",
} as const;

export const CARD_ONBOARDING_RESOURCES = {
  en: {
    translation: {
      payTab: {
        cardOnboarding: {
          widget: {
            title: CARD_ONBOARDING_COPY.widgetTitle,
            allDone: CARD_ONBOARDING_COPY.widgetAllDone,
          },
          dialog: {
            title: CARD_ONBOARDING_COPY.dialogTitle,
            stepComplete: CARD_ONBOARDING_COPY.stepComplete,
            gotIt: CARD_ONBOARDING_COPY.gotIt,
          },
          walletStep: {
            title: CARD_ONBOARDING_COPY.walletStepTitle,
            description: CARD_ONBOARDING_COPY.walletStepDescription,
          },
        },
      },
    },
  },
};

export function I18nWrapper({ children }: { children: React.ReactNode }) {
  return <I18nTestProvider resources={CARD_ONBOARDING_RESOURCES}>{children}</I18nTestProvider>;
}
