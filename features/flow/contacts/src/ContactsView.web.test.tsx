import React from "react";
import { render as renderWithoutI18n, screen } from "@testing-library/react";
import {
  ContactsI18nTestProvider,
  formatTestContactDisplayName,
} from "@features/platform-contacts/testing";
import { mockMeContact, mockPopulatedContacts } from "@domain/entity-contact/schema.mock";
import type { Contact } from "@domain/entity-contact";
import { createContactsSearchViewModel } from "@features/flow-contacts-list";
import { ContactsView } from "./ContactsView.web";

const render = (ui: React.ReactElement) =>
  renderWithoutI18n(ui, { wrapper: ContactsI18nTestProvider });

describe("ContactsView", () => {
  it("should hide add contact actions when a search has no result", () => {
    const contacts = mockPopulatedContacts();
    const me = contacts.find(contact => contact.isMe) ?? mockMeContact();

    render(
      <ContactsView
        viewModel={createContactsSearchViewModel(
          me,
          contacts,
          "unknown",
          formatTestContactDisplayName,
        )}
        searchQuery="unknown"
        onSearchInputChange={jest.fn()}
        onOpenMe={jest.fn()}
        onOpenContact={jest.fn()}
        onAddContact={jest.fn()}
        ledgerSyncStatus="ready"
        featureIntroduction={{
          isOpen: false,
          onComplete: jest.fn(),
          onClose: jest.fn(),
        }}
        ledgerSyncIntroduction={{
          isOpen: false,
          onActivate: jest.fn(),
          onDismiss: jest.fn(),
        }}
      />,
    );

    expect(screen.getByTestId("contacts-search-no-results")).toBeVisible();
    expect(screen.queryByTestId("contacts-add-contact")).not.toBeInTheDocument();
    expect(screen.queryByTestId("contacts-add-contact-header")).not.toBeInTheDocument();
  });

  it("should show the Ledger Sync introduction while sync is unavailable", () => {
    const contacts = mockPopulatedContacts();
    const me = contacts.find(contact => contact.isMe) ?? mockMeContact();

    render(
      <ContactsView
        viewModel={createContactsSearchViewModel(me, contacts, "", formatTestContactDisplayName)}
        searchQuery=""
        onSearchInputChange={jest.fn()}
        onOpenMe={jest.fn()}
        onOpenContact={jest.fn()}
        onAddContact={jest.fn()}
        ledgerSyncStatus="unavailable"
        featureIntroduction={{
          isOpen: false,
          onComplete: jest.fn(),
          onClose: jest.fn(),
        }}
        ledgerSyncIntroduction={{
          isOpen: true,
          onActivate: jest.fn(),
          onDismiss: jest.fn(),
        }}
      />,
    );

    expect(screen.getByText("contacts.ledgerSyncIntroduction.description")).toBeVisible();
  });
});
