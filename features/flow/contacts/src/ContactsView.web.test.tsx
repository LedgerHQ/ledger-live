import React from "react";
import { fireEvent, render as renderWithoutI18n, screen } from "@testing-library/react";
import {
  ContactsI18nTestProvider,
  formatTestContactDisplayName,
} from "@features/platform-contacts/testing";
import { mockMeContact, mockPopulatedContacts } from "@domain/entity-contact/schema.mock";
import {
  createContactsListViewModel,
  createContactsSearchViewModel,
} from "@features/flow-contacts-list";
import { ContactsView } from "./ContactsView";

const render = (ui: React.ReactElement) =>
  renderWithoutI18n(ui, { wrapper: ContactsI18nTestProvider });

describe("ContactsView", () => {
  it("should hide add contact actions when a search has no result", () => {
    const contacts = mockPopulatedContacts();
    const me = contacts.find(contact => contact.isMe) ?? mockMeContact();
    const onSearchQueryChange = jest.fn();

    render(
      <ContactsView
        viewModel={createContactsSearchViewModel(
          me,
          contacts,
          "unknown",
          formatTestContactDisplayName,
        )}
        searchQuery="unknown"
        onSearchQueryChange={onSearchQueryChange}
        onOpenContact={jest.fn()}
        onAddContact={jest.fn()}
        ledgerSyncStatus="ready"
      />,
    );

    expect(screen.getByTestId("contacts-search-no-results")).toBeVisible();
    expect(screen.queryByTestId("contacts-add-contact")).not.toBeInTheDocument();
    expect(screen.queryByTestId("contacts-add-contact-header")).not.toBeInTheDocument();
  });

  it("should forward search input changes as query strings", () => {
    const contacts = mockPopulatedContacts();
    const me = contacts.find(contact => contact.isMe) ?? mockMeContact();
    const onSearchQueryChange = jest.fn();

    render(
      <ContactsView
        viewModel={createContactsListViewModel(me, contacts)}
        searchQuery=""
        onSearchQueryChange={onSearchQueryChange}
        onOpenContact={jest.fn()}
        onAddContact={jest.fn()}
        ledgerSyncStatus="ready"
      />,
    );

    fireEvent.change(screen.getByTestId("contacts-list-search"), {
      target: { value: "a" },
    });

    expect(onSearchQueryChange).toHaveBeenCalledWith("a");
  });
});
