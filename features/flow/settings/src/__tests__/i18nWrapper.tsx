import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

const resources = {
  en: {
    translation: {
      settings: {
        title: "Settings",
        sections: {
          general: "General",
          assetManagement: "Asset management",
          security: "Security",
          notifications: "Notifications",
          privacy: "Privacy",
          about: "About",
        },
        developer: { title: "Developer" },
        debug: { title: "Debug" },
        switchToLegacy: "Back to previous Settings",
      },
    },
  },
};

export function I18nWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <I18nTestProvider resources={resources}>{children}</I18nTestProvider>;
}
