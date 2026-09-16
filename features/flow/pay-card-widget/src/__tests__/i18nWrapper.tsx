import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

export const CARD_ONBOARDING_COPY = {
  widgetTitle: "Set up your card",
  widgetAllDone: "You're all set",
  dialogTitle: "Complete your card",
  stepComplete: "Completed",
  gotIt: "Got it",
} as const;

/** One title/description pair per real step id, keyed the way `useOnboardingSteps` looks them up. */
export const CARD_ONBOARDING_STEP_COPY = {
  "create-account": { title: "Create account step", description: "Create account description" },
  "choose-card-type": {
    title: "Choose card type step",
    description: "Choose card type description",
  },
  "top-up-card": { title: "Top up card step", description: "Top up card description" },
  "first-purchase": { title: "First purchase step", description: "First purchase description" },
  "apple-google-pay": {
    title: "Add to Apple/Google Pay",
    description: "Pay with your phone in store",
  },
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
          steps: {
            createAccount: CARD_ONBOARDING_STEP_COPY["create-account"],
            chooseCardType: CARD_ONBOARDING_STEP_COPY["choose-card-type"],
            topUpCard: CARD_ONBOARDING_STEP_COPY["top-up-card"],
            firstPurchase: CARD_ONBOARDING_STEP_COPY["first-purchase"],
            appleGooglePay: CARD_ONBOARDING_STEP_COPY["apple-google-pay"],
          },
        },
      },
    },
  },
};

export function I18nWrapper({ children }: { children: React.ReactNode }) {
  return <I18nTestProvider resources={CARD_ONBOARDING_RESOURCES}>{children}</I18nTestProvider>;
}
