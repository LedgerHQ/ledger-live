import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

const resources = {
  en: {
    translation: {
      settings: {
        notifications: {
          osPermissionBanner: {
            title: "Notifications are disabled",
            description: "Go to your phone settings.",
            action: "Turn on notifications",
          },
          allowed: { title: "Allow notifications", desc: "Receive notifications" },
          announcements: { title: "Announcements", desc: "Ledger Wallet updates" },
          largeMover: { title: "Price Alerts", desc: "Price movements" },
          transactionsAlerts: { title: "Transaction Alerts (Beta)", desc: "Your transactions" },
          totalMarketCap: { title: "Total Market Cap", desc: "Market cap moves" },
          topGainersLosers: { title: "Top Gainers and Losers", desc: "Weekly recap" },
        },
      },
    },
  },
};

export function I18nWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <I18nTestProvider resources={resources}>{children}</I18nTestProvider>;
}
