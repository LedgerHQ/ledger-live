import React, { type FC, type ReactElement, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import {
  addContact,
  contact,
  contactsSlice,
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
  type Contact,
} from "@domain/entity-contact";
import type { AddContactDialogViewModel } from "@features/flow-contacts-add-contact";
import { StyleProvider } from "@features/platform-style";
import type {
  ContactsProps,
  ContactsTableLabels,
  ContactsViewProps,
  PayAddContactProps,
} from "../../../types";

export function makeContactsStore(contacts: Contact[]) {
  return configureStore({
    reducer: { contacts: contactsSlice.reducer },
    preloadedState: { contacts: { contacts } },
  });
}

export function makeContactsWrapper(contacts: Contact[]): FC<{ children: ReactNode }> {
  const store = makeContactsStore(contacts);

  return ({ children }) => <Provider store={store}>{children}</Provider>;
}

export function renderWithStyle(ui: ReactElement) {
  return render(<StyleProvider colorScheme="dark">{ui}</StyleProvider>);
}

export function renderWithContacts(
  contacts: Contact[],
  ui: ReactElement,
  store = makeContactsStore(contacts),
) {
  return {
    store,
    ...render(
      <Provider store={store}>
        <StyleProvider colorScheme="dark">{ui}</StyleProvider>
      </Provider>,
    ),
  };
}

export const emptyStateLabels: ContactsProps["emptyState"] = {
  info: "You don’t have contact yet",
  addContactLabel: "Add contact",
};

export const tableLabels: ContactsTableLabels = {
  name: "Name",
  addresses: "Addresses",
  transactions: "Transactions",
  formatTransactionCount: count => `${count} transaction`,
  payAction: "Pay",
  moreAction: "More",
  viewTransactions: "View transactions",
};

export function renderAddresses() {
  return null;
}

export function makeAddContactProps(
  overrides: Partial<PayAddContactProps> = {},
): PayAddContactProps {
  return {
    labels: {
      title: "Add contact",
      namePlaceholder: "Contact name",
      namingDisclaimer: "Use a nickname.",
      confirmName: "Add contact",
      nameValidationErrors: {
        [INVALID_CONTACT_NAME_ERROR_NAME]: "Special characters are not allowed.",
        [DUPLICATE_CONTACT_NAME_ERROR_NAME]: "This contact name is already in use.",
      },
    },
    contactCreation: {
      createContact: async ({ name }) =>
        contact({ id: "contact-created", isMe: false, name, addresses: [] }),
    },
    onRequestAddContact: onAllowed => onAllowed(),
    ...overrides,
  };
}

export function makeContactsProps(overrides: Partial<ContactsProps> = {}): ContactsProps {
  return {
    title: "Pay contact",
    emptyState: emptyStateLabels,
    addContact: makeAddContactProps(),
    labels: tableLabels,
    renderAddresses,
    ...overrides,
  };
}

export function makeAddContactDialogViewModel(
  overrides: Partial<AddContactDialogViewModel> = {},
): AddContactDialogViewModel {
  return {
    isConfirmEnabled: false,
    isSaving: false,
    draftName: "",
    avatarInitial: "",
    invalidNameError: null,
    onDraftNameChange: jest.fn(),
    onConfirm: jest.fn(async () => undefined),
    reset: jest.fn(),
    isOpen: false,
    labels: makeAddContactProps().labels,
    onOpen: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  };
}

export function makeContactsViewProps(
  overrides: Partial<ContactsViewProps> = {},
): ContactsViewProps {
  return {
    title: "Pay contact",
    isEmpty: true,
    rows: [],
    labels: tableLabels,
    renderAddresses,
    emptyState: { ...emptyStateLabels, onAddContact: jest.fn() },
    addContactDialog: makeAddContactDialogViewModel(),
    ...overrides,
  };
}

export { addContact, contact };
