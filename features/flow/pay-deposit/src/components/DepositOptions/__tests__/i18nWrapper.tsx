import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

type Resources = React.ComponentProps<typeof I18nTestProvider>["resources"];

/**
 * A `renderHook` / `render` wrapper that mounts the shared i18n test provider. With no `resources`
 * every key resolves to itself; pass `resources` to assert copy comes from the provider.
 */
export function i18nWrapper(resources?: Resources) {
  return function I18nWrapper({ children }: { children: React.ReactNode }) {
    return <I18nTestProvider resources={resources}>{children}</I18nTestProvider>;
  };
}

/** The `payTab.deposit.*` copy each app ships, mirrored for the deposit-options tests. */
export const DEPOSIT_RESOURCES = {
  en: {
    translation: {
      payTab: {
        deposit: {
          title: "Deposit stablecoin",
          options: {
            bankTransfer: { title: "Bank transfer", description: "From your bank account" },
            swap: { title: "Swap", description: "From your crypto" },
            receive: { title: "Receive", description: "From another wallet" },
            buy: { title: "Buy", description: "With card or bank" },
          },
        },
      },
    },
  },
};
