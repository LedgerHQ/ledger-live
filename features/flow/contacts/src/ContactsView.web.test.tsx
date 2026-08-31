import React from "react";
import { render, screen } from "@testing-library/react";
import { mockMeContact, mockPopulatedContacts } from "@domain/entity-contact/schema.mock";
import { createContactsSearchViewModel } from "@features/flow-contacts-list";
import { ContactsView } from "./ContactsView.web";

const labels = {
  title: "Contacts",
  searchPlaceholder: "Search contact",
  searchNoResults: "No contact found",
  addContact: "Add contact",
  ledgerSyncCheckingAccessibilityLabel: "Checking Ledger Sync status",
  formatAddressCount: (count: number) => `${count} address`,
};

describe("ContactsView", () => {
  it("should hide add contact actions when a search has no result", () => {
    const contacts = mockPopulatedContacts();
    const me = contacts.find(contact => contact.isMe) ?? mockMeContact();

    render(
      <ContactsView
        viewModel={createContactsSearchViewModel(me, contacts, "unknown")}
        labels={labels}
        searchQuery="unknown"
        meAvatarSrc="https://example.com/black/user.png"
        onSearchInputChange={jest.fn()}
        onOpenMe={jest.fn()}
        onOpenContact={jest.fn()}
        onAddContact={jest.fn()}
        ledgerSyncStatus="ready"
        featureIntroduction={{
          isOpen: false,
          title: "Add contacts",
          highlights: [],
          primaryActionLabel: "Try contacts",
          onComplete: jest.fn(),
          onClose: jest.fn(),
        }}
        ledgerSyncIntroduction={{
          isOpen: false,
          description: "Keep contacts in sync.",
          dismissLabel: "Got it",
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
        viewModel={createContactsSearchViewModel(me, contacts, "")}
        labels={labels}
        searchQuery=""
        meAvatarSrc="https://example.com/black/user.png"
        onSearchInputChange={jest.fn()}
        onOpenMe={jest.fn()}
        onOpenContact={jest.fn()}
        onAddContact={jest.fn()}
        ledgerSyncStatus="unavailable"
        featureIntroduction={{
          isOpen: false,
          title: "Add contacts",
          highlights: [],
          primaryActionLabel: "Try contacts",
          onComplete: jest.fn(),
          onClose: jest.fn(),
        }}
        ledgerSyncIntroduction={{
          isOpen: true,
          description: "Keep contacts in sync.",
          dismissLabel: "Got it",
          onDismiss: jest.fn(),
        }}
      />,
    );

    expect(screen.getByText("Keep contacts in sync.")).toBeVisible();
  });
});
