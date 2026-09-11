import React, { type ReactElement } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { render } from "@testing-library/react-native";
import { Provider } from "react-redux";
import { contactsSlice, type Contact } from "@domain/entity-contact";
import { I18nTestProvider } from "@shared/i18n/testing";
import type { ContactsNativeProps } from "../../../types";
import { CONTACTS_RESOURCES, type I18nResources } from "./i18n";

export { CONTACTS_RESOURCES };

export function makeContactsStore(contacts: Contact[]) {
  return configureStore({
    reducer: { contacts: contactsSlice.reducer },
    preloadedState: { contacts: { contacts } },
  });
}

export function renderWithContacts(
  contacts: Contact[],
  ui: ReactElement,
  store = makeContactsStore(contacts),
  resources: I18nResources = CONTACTS_RESOURCES,
) {
  return {
    store,
    ...render(
      <Provider store={store}>
        <I18nTestProvider resources={resources}>{ui}</I18nTestProvider>
      </Provider>,
    ),
  };
}

export function makeContactsProps(
  overrides: Partial<ContactsNativeProps> = {},
): ContactsNativeProps {
  return {
    onPay: jest.fn(),
    onSeeAll: jest.fn(),
    ...overrides,
  };
}
