import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

const resources = {
  en: {
    translation: {
      accountDetailNotices: {
        actions: { learnMore: "Learn more", openPerps: "Open Perps" },
        migration: {
          title: "{{from}} is migrating to {{to}}",
          description: "Learn more about the migration, or contact support if you need assistance.",
        },
        willBeDeprecated: {
          title: "{{currencyName}} will not be supported as of {{date}}",
          description:
            "It will still be secured by your Ledger device. Learn more in the Help Center.",
        },
        robinhoodDisclaimer: { title: "Total balance does not include dividends or stock splits." },
        perps: {
          title: "About Hyperliquid account",
          description:
            "This account is related to Perpetual trading. Transactional actions are not supported for this account",
        },
      },
    },
  },
};

export function I18nWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <I18nTestProvider resources={resources}>{children}</I18nTestProvider>;
}
