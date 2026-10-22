import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";
import { LinkingProvider } from "@shared/linking";

export const openExternal = jest.fn();
export const onLinkOpened = jest.fn();

const resources = {
  en: {
    translation: {
      accountDetailSettings: {
        title: "Account settings",
        menu: {
          changeName: "Change name",
          viewAdvancedLogs: "View advanced logs",
          viewExplorer: "View Explorer",
          removeAccount: "Remove account from portfolio",
        },
        changeName: {
          title: "Change account name",
          description:
            "Give this address a name to stay organized (ex. {{ticker}}-Trading, {{ticker}}-DeFi).",
          label: "Address name",
          submit: "Change name",
        },
        advancedLogs: {
          title: "Advanced logs",
          derivationTip:
            "This is a {{tag}} xpub. When importing it into a third-party wallet, choose the same derivation mode.",
          synchronised: "Synchronised {{date}}",
          copy: "Copy logs",
          copied: "Copied",
        },
        remove: {
          title: "Remove account?",
          description:
            "The assets linked to this account will no longer be visible in your portfolio. Your assets on the blockchain remain unaffected.",
          confirm: "Yes, remove.",
          cancel: "Keep",
        },
      },
    },
  },
};

export function I18nWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <LinkingProvider config={{ openExternal, onLinkOpened }}>
      <I18nTestProvider resources={resources}>{children}</I18nTestProvider>
    </LinkingProvider>
  );
}
