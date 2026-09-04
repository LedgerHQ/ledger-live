import React, { type ReactElement } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { render } from "@testing-library/react-native";
import { Provider } from "react-redux";
import { contactsSlice, type Contact } from "@domain/entity-contact";
import type { ContactsNativeProps } from "../../../types";

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
) {
  return {
    store,
    ...render(<Provider store={store}>{ui}</Provider>),
  };
}

export function makeContactsProps(
  overrides: Partial<ContactsNativeProps> = {},
): ContactsNativeProps {
  return {
    title: "Pay contact",
    payLabel: "Pay",
    onPay: jest.fn(),
    onSeeAll: jest.fn(),
    ...overrides,
  };
}
