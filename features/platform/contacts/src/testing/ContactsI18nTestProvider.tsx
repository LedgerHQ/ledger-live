import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

export const CONTACT_DISPLAY_NAME_TRANSLATIONS = {
  contacts: {
    me: { myAddresses: "My addresses" },
    detail: { meDisplayName: "{{name}} (Me)" },
  },
};

/** Test-only provider so `useContactDisplayName` renders "My addresses (Me)" / "<name> (Me)". */
export function ContactsI18nTestProvider({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <I18nTestProvider resources={{ en: { translation: CONTACT_DISPLAY_NAME_TRANSLATIONS } }}>
      {children}
    </I18nTestProvider>
  );
}
