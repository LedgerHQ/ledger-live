import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

const resources = {
  en: {
    translation: {
      settings: {
        about: {
          version: { title: "Version" },
          terms: {
            title: "Terms and conditions",
            description:
              "By using Ledger Wallet you are deemed to have accepted our terms and conditions",
          },
          feedback: { title: "Give us feedback on the app" },
          rate: { title: "Rate us on {{storeName}}" },
          connect: {
            title: "Connect with us",
            x: "Follow us on X",
            instagram: "Follow us on Instagram",
            github: "Review our Github",
          },
        },
      },
    },
  },
};

export function I18nWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <I18nTestProvider resources={resources}>{children}</I18nTestProvider>;
}
