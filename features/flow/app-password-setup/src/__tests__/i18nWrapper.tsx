import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

type Resources = React.ComponentProps<typeof I18nTestProvider>["resources"];

export function i18nWrapper(resources: Resources = PASSWORD_SETUP_RESOURCES) {
  return function I18nWrapper({ children }: { children: React.ReactNode }) {
    return <I18nTestProvider resources={resources}>{children}</I18nTestProvider>;
  };
}

export const PASSWORD_SETUP_RESOURCES = {
  en: {
    translation: {
      appLock: {
        field: {
          label: "Password",
          reveal: "Show password",
          hide: "Hide password",
          minLength: "At least 6 characters",
        },
        setupPassword: { cta: "Continue" },
        confirmPassword: {
          cta: "Confirm",
          mismatch: "Passwords don't match",
          saveFailed: "We couldn't save your password",
        },
      },
    },
  },
};
