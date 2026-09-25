import React from "react";
import { createI18nTestInstance, I18nTestProvider } from "@shared/i18n/testing";
import {
  formatContactDisplayName,
  type ContactDisplayNameInput,
} from "../utils/formatContactDisplayName";

const CONTACT_DISPLAY_NAME_TRANSLATIONS = {
  contacts: {
    me: { myAddresses: "My addresses" },
    detail: { meDisplayName: "{{name}} (Me)" },
  },
};

const CONTACTS_TEST_RESOURCES = { en: { translation: CONTACT_DISPLAY_NAME_TRANSLATIONS } };

const contactsTestI18n = createI18nTestInstance({ resources: CONTACTS_TEST_RESOURCES });

export { CONTACT_DISPLAY_NAME_TRANSLATIONS };

/** `formatContactDisplayName` with the real English copy, for tests of pure view models. */
export function formatTestContactDisplayName(contact: ContactDisplayNameInput): string {
  return formatContactDisplayName(contact, contactsTestI18n.t);
}

/** Test-only provider so `useContactDisplayName` renders "My addresses (Me)" / "<name> (Me)". */
export function ContactsI18nTestProvider({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return <I18nTestProvider resources={CONTACTS_TEST_RESOURCES}>{children}</I18nTestProvider>;
}
