import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

const resources = {
  en: {
    translation: {
      accountDetailHero: {
        emptyState: {
          title: "No activity yet",
          description: {
            receive: "Start by adding funds through Receive.",
            receiveSwap: "Start by adding funds through Receive or Swap.",
            receiveBuy: "Start by adding funds through Receive or Buy.",
            receiveSwapBuy: "Start by adding funds through Receive, Swap or Buy.",
            swap: "Start by adding funds through Swap.",
            buy: "Start by adding funds through Buy.",
            swapBuy: "Start by adding funds through Swap or Buy.",
          },
        },
        actions: {
          transfer: "Transfer",
          receive: "Receive",
          send: "Send",
          swap: "Swap",
          buy: "Buy",
          sell: "Sell",
          earn: "Earn",
          more: "More",
        },
      },
    },
  },
};

export function I18nWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <I18nTestProvider resources={resources}>{children}</I18nTestProvider>;
}
