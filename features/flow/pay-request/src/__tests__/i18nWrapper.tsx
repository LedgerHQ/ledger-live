import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

type Resources = React.ComponentProps<typeof I18nTestProvider>["resources"];

export function i18nWrapper(resources?: Resources) {
  return function I18nWrapper({ children }: { children: React.ReactNode }) {
    return <I18nTestProvider resources={resources}>{children}</I18nTestProvider>;
  };
}

/** The `payTab.request.*` copy each app ships, mirrored for the pay-request tests. */
export const REQUEST_RESOURCES = {
  en: {
    translation: {
      payTab: {
        request: {
          title: "Request {{asset}}",
          networkLabel: "{{network}} network",
          actions: {
            share: "Share",
            copy: "Copy",
            copied: "Copied",
            save: "Save",
            verify: "Verify",
          },
          verifyHint: {
            message: "Verify your address on your Ledger device before sharing",
            gotIt: "Got it",
          },
          verifyAddress: {
            introTitle: "Verify your address",
            introDescription:
              "To protect against address replacement attacks, verify your address.",
            verifyCta: "Verify address",
            successTitle: "Address displayed on the device's Secure Screen",
            nextStepsLabel: "Next steps",
            nextStepShare: "Share your address via your desired app",
            nextStepMatch: "Ensure the shared address matches the one on your Ledger Device.",
            gotItCta: "Got it",
          },
        },
      },
    },
  },
};

export const REQUEST_RECEIVE_TITLE = "Request USD Coin";
export const REQUEST_RECEIVE_NETWORK_LABEL = "Base network";
export const REQUEST_RECEIVE_ACTIONS = REQUEST_RESOURCES.en.translation.payTab.request.actions;
export const VERIFY_HINT_MESSAGE =
  REQUEST_RESOURCES.en.translation.payTab.request.verifyHint.message;
export const VERIFY_HINT_GOT_IT = REQUEST_RESOURCES.en.translation.payTab.request.verifyHint.gotIt;
export const VERIFY_ADDRESS_COPY = REQUEST_RESOURCES.en.translation.payTab.request.verifyAddress;
