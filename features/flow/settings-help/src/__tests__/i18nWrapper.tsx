import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

const resources = {
  en: {
    translation: {
      settings: {
        helpPage: {
          title: "Help",
          groups: {
            supportAndLearning: "Support and learning",
            more: "More",
          },
          support: {
            title: "Ledger support",
            description: "Get help with our FAQs or chat",
          },
          saveLogs: {
            description: "Saving logs may be needed for troubleshooting purposes.",
          },
          status: {
            title: "Ledger status",
          },
          clearCache: {
            description:
              "Your network transactions will be scanned and your accounts will be recalculated.",
          },
          viewUserData: {
            description:
              "View the local data stored on this computer, including account settings and cached info.",
          },
          resetApp: {
            description:
              "Erase all local data from this computer. Your funds remain safe on the blockchain, but you will need to re-import your accounts.",
          },
        },
        exportLogs: { title: "Save logs", btn: "Save" },
        profile: {
          softResetTitle: "Clear cache",
          softReset: "Clear",
          hardResetTitle: "Reset Ledger Wallet",
          launchOnboarding: "Device setup",
          launchOnboardingDesc: "Set up a new device or restore an existing device.",
        },
        softResetModal: { title: "Clear cache", desc: "Clearing the cache forces a resync." },
        hardResetModal: {
          title: "Reset Ledger Wallet",
          desc: "Reset Ledger Wallet to erase all settings and accounts.",
          warning: "Resetting Ledger Wallet will erase your swap transaction history.",
        },
        openUserDataDirectory: { title: "View user data", btn: "View" },
        troubleshootNetwork: {
          title: "Troubleshoot networking",
          desc: "Run a checklist to assess networking conditions.",
          btn: "Troubleshoot",
        },
        repairDevice: {
          title: "Repair your Ledger device",
          descSettings: "Use this to restore your Ledger device.",
          button: "Repair",
        },
      },
      help: {
        ledgerAcademy: { title: "Ledger Academy", desc: "Learn crypto" },
        status: { desc: "Check our system status" },
      },
      common: {
        cancel: "Cancel",
        launch: "Launch",
        reset: "Reset",
      },
    },
  },
};

export function I18nWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <I18nTestProvider resources={resources}>{children}</I18nTestProvider>;
}
