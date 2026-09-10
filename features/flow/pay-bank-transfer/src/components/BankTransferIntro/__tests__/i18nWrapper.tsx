import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";
import { BANK_TRANSFER_INTRO_RESOURCES } from "./fixtures";

export function I18nWrapper({ children }: { children: React.ReactNode }) {
  return <I18nTestProvider resources={BANK_TRANSFER_INTRO_RESOURCES}>{children}</I18nTestProvider>;
}
