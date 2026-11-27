import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

const resources = {
  en: {
    translation: {
      settings: {
        privacy: {
          bugReports: {
            title: "Bug reports",
            description: "Automatically send reports to help Ledger improve its products.",
          },
          appPerformance: {
            title: "App performance",
            description: "Enable Ledger to collect app usage to enhance the experience",
          },
          personalizedExperience: {
            title: "Personalized experience",
            description:
              "Enable Ledger to collect app usage to provide personalized recommendations",
          },
          analytics: {
            title: "Analytics",
            description: "Enable analytics to help Ledger improve user experience.",
          },
          privacyPolicy: {
            title: "Privacy policy",
            description: "See what personal data are collected, why and how they are used",
          },
        },
      },
    },
  },
};

export function I18nWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <I18nTestProvider resources={resources}>{children}</I18nTestProvider>;
}
