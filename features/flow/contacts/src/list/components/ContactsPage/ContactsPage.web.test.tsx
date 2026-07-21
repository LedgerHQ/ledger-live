import React from "react";
import { render, screen } from "@testing-library/react";
import { mockMeContact, mockPopulatedContacts } from "@domain/entity-contact/schema.mock";
import type { ContactsLedgerSyncStatus, ContactsPageViewModel } from "../../types";
import {
  createContactsSearchViewModel,
  createEmptyContactsListViewModel,
  createPopulatedContactsListViewModel,
} from "../../viewModel";
import { ContactsPage } from "./ContactsPage.web";

const labels = {
  title: "Contacts",
  searchPlaceholder: "Search contact",
  searchNoResults: "No contact found",
  addContact: "Add contact",
  ledgerSyncCheckingAccessibilityLabel: "Checking Ledger Sync status",
  formatAddressCount: (count: number) => `${count} address`,
};

type RenderContactsPageOptions = Readonly<{
  viewModel?: ContactsPageViewModel;
  ledgerSyncStatus?: ContactsLedgerSyncStatus;
  searchQuery?: string;
}>;

function renderContactsPage({
  viewModel = createEmptyContactsListViewModel(mockMeContact()),
  ledgerSyncStatus = "ready",
  searchQuery = "",
}: RenderContactsPageOptions = {}) {
  render(
    <ContactsPage
      viewModel={viewModel}
      labels={labels}
      meAvatarSrc="https://example.com/black/user.png"
      onOpenMe={jest.fn()}
      onOpenContact={jest.fn()}
      onAddContact={jest.fn()}
      searchQuery={searchQuery}
      onSearchInputChange={jest.fn()}
      ledgerSyncStatus={ledgerSyncStatus}
      ledgerSyncIntroduction={{
        isOpen: false,
        description: "",
        dismissLabel: "",
        onDismiss: jest.fn(),
      }}
    />,
  );
}

describe("ContactsPage", () => {
  it("renders the empty contacts list inside the page", () => {
    renderContactsPage();

    const pageLayout = screen.getByTestId("contacts-page-layout");
    const contactsList = screen.getByTestId("contacts-list");

    expect(pageLayout).toBeVisible();
    expect(screen.getByTestId("contacts-list-pane")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-pane").childElementCount).toBe(0);
    expect(contactsList).toBeVisible();
    expect(pageLayout).toHaveTextContent("Contacts");
    expect(contactsList).toHaveTextContent("Me");
    expect(contactsList).toHaveTextContent("0 address");
    expect(contactsList).toHaveTextContent("Add contact");
    expect(screen.queryByTestId("contacts-section-A")).not.toBeInTheDocument();
  });

  it("renders saved contacts in alphabetical sections", () => {
    const contacts = mockPopulatedContacts();
    const me = contacts.find(contact => contact.isMe) ?? mockMeContact();

    renderContactsPage({
      viewModel: createPopulatedContactsListViewModel(me, contacts),
    });

    const contactsList = screen.getByTestId("contacts-list");

    expect(screen.getByTestId("contacts-section-A")).toBeVisible();
    expect(screen.getByTestId("contacts-section-B")).toBeVisible();
    expect(screen.getByTestId("contacts-section-O")).toBeVisible();
    expect(contactsList).toHaveTextContent("Ada");
    expect(contactsList).toHaveTextContent("0 address");
    expect(contactsList).toHaveTextContent("Ben");
    expect(contactsList).toHaveTextContent("2 address");
    expect(contactsList).toHaveTextContent("Olive");
    expect(screen.getByTestId("contacts-saved-avatar-contact-ada")).toHaveTextContent("A");
    expect(contactsList).toHaveTextContent("Add contact");
  });

  it("keeps the Contacts page visible while Ledger Sync is checking", () => {
    renderContactsPage({ ledgerSyncStatus: "checking" });

    expect(screen.getByTestId("contacts-page-layout")).toBeVisible();
    expect(screen.getByTestId("contacts-list")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-pane")).toBeVisible();
    expect(screen.getByTestId("contacts-ledger-sync-list-loading")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByTestId("contacts-ledger-sync-detail-loading")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("renders matching search results", () => {
    const contacts = mockPopulatedContacts();
    const me = contacts.find(contact => contact.isMe) ?? mockMeContact();

    renderContactsPage({
      viewModel: createContactsSearchViewModel(me, contacts, "ben"),
      searchQuery: "ben",
    });

    const contactsList = screen.getByTestId("contacts-list");

    expect(contactsList).toHaveTextContent("Ben");
    expect(contactsList).not.toHaveTextContent("Ada");
    expect(screen.queryByTestId("contacts-search-no-results")).not.toBeInTheDocument();
  });

  it("renders the no-results state when the search query has no match", () => {
    const contacts = mockPopulatedContacts();
    const me = contacts.find(contact => contact.isMe) ?? mockMeContact();

    renderContactsPage({
      viewModel: createContactsSearchViewModel(me, contacts, "unknown"),
      searchQuery: "unknown",
    });

    const contactsList = screen.getByTestId("contacts-list");

    expect(screen.getByTestId("contacts-search-no-results")).toBeVisible();
    expect(screen.getByText("No contact found")).toBeVisible();
    expect(contactsList).not.toHaveTextContent("Ben");
  });
});
