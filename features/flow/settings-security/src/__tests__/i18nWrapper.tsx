import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

const resources = {
  en: {
    translation: {
      settings: {
        security: {
          hideBalance: {
            title: "Hide balance",
            description:
              "Hide amounts for all balances. You can also access it from your top main navigation.",
          },
          appLock: {
            title: "App lock",
            description: "Set a password to open the app.",
          },
          changePassword: {
            title: "Change password",
            description: "Replace the password that opens the app.",
            action: "Change",
          },
          autoLock: {
            title: "Auto-lock",
            description: "Automatically lock Ledger Wallet when inactive.",
            options: {
              oneMinute: "1 minute",
              tenMinutes: "10 minutes",
              thirtyMinutes: "30 minutes",
              oneHour: "1 hour",
              never: "Never",
            },
          },
          biometrics: {
            description: "Use {{biometric}} to open the app.",
            disabledDescription: 'To enable {{biometric}}, turn on "App lock".',
            kind: {
              faceId: "Face ID",
              touchId: "Touch ID",
              biometrics: "Biometrics",
            },
          },
          mevProtection: {
            title: "MEV protection",
            description: "Enable for more reliable transactions on Ethereum.",
            learnMore: "Learn more",
          },
        },
      },
    },
  },
};

export function I18nWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <I18nTestProvider resources={resources}>{children}</I18nTestProvider>;
}
