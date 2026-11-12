import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

type Resources = React.ComponentProps<typeof I18nTestProvider>["resources"];

export function i18nWrapper(resources?: Resources) {
  return function I18nWrapper({ children }: { children: React.ReactNode }) {
    return <I18nTestProvider resources={resources}>{children}</I18nTestProvider>;
  };
}

/** The `receiveAddress.*` copy each app ships, mirrored for the receive tests. */
export const RECEIVE_RESOURCES = {
  en: {
    translation: {
      receiveAddress: {
        retry: "Try again",
        useLegacyFlow: "Continue",
        blocked: {
          readFailed: {
            title: "Your address couldn't be loaded",
            description: "Check your connection and try again.",
          },
          assetActivationRequired: {
            title: "Activate {{asset}} on {{network}}",
            description: "The classic receive flow walks you through it.",
          },
          assetActivationPending: {
            title: "Activation in progress",
            description: "Try again in a moment.",
          },
        },
        assetActivation: {
          activate: "Activate",
          trustline: "Your account must add a trustline for this asset before receiving it.",
        },
        addressDisplayed: {
          title: "Address securely displayed",
          description:
            "Verify that the address once pasted or shared matches the one on your Ledger Device.",
          gotItCta: "Got it",
        },
      },
    },
  },
};

export const VERIFY_SUCCESS_COPY = RECEIVE_RESOURCES.en.translation.receiveAddress.addressDisplayed;
