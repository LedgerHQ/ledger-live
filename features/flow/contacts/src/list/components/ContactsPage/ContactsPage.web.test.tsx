import React from "react";
import { render, screen } from "@testing-library/react";
import { mockMeContact, mockPopulatedContacts } from "@domain/entity-contact/schema.mock";
import type { ContactsLedgerSyncStatus, ContactsPageViewModel } from "../../types";
import {
  createContactsSearchViewModel,
  createEmptyContactsListViewModel,
  createPopulatedContactsListViewModel,
} from "../../viewModel";
import { createClosedContactsFeatureIntroduction } from "../../createClosedContactsFeatureIntroduction";
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
  isFeatureIntroductionOpen?: boolean;
  onDismissFeatureIntroduction?: () => void;
  isIntroductionOpen?: boolean;
  onDismissIntroduction?: () => void;
  onOpenMe?: (contactId: ContactId) => void;
  onOpenContact?: (contactId: ContactId) => void;
  onAddContact?: () => void;
  searchQuery?: string;
}>;

function renderContactsPage({
  viewModel = createEmptyContactsListViewModel(mockMeContact()),
  ledgerSyncStatus = "ready",
  isFeatureIntroductionOpen = false,
  onDismissFeatureIntroduction = jest.fn(),
  isIntroductionOpen = false,
  onDismissIntroduction = jest.fn(),
  onOpenMe = jest.fn(),
  onOpenContact = jest.fn(),
  onAddContact = jest.fn(),
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
      featureIntroduction={
        isFeatureIntroductionOpen
          ? {
              isOpen: true,
              title: "Introducing Contacts",
              description:
                "Your address book for crypto — save the wallets you send to, all in one place.",
              highlights: [
                {
                  title: "Save addresses once",
                  description: "Keep the addresses you send to in one place.",
                  icon: "Contact",
                },
              ],
              primaryActionLabel: "Try contacts",
              secondaryActionLabel: "Maybe later",
              onDismiss: onDismissFeatureIntroduction,
            }
          : createClosedContactsFeatureIntroduction()
      }
      ledgerSyncIntroduction={{
        isOpen: false,
        description: "",
        dismissLabel: "",
        onDismiss: jest.fn(),
      }}
    />,
  );

  return {
    onDismissFeatureIntroduction,
    onDismissIntroduction,
    onOpenMe,
    onOpenContact,
    onAddContact,
    onSearchInputChange,
  };
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

  it("shows the feature introduction over the Contacts page and dismisses it once", () => {
    const onDismissFeatureIntroduction = jest.fn();

    renderContactsPage({
      isFeatureIntroductionOpen: true,
      onDismissFeatureIntroduction,
    });

    expect(screen.getByTestId("contacts-list")).toBeVisible();
    expect(screen.getByText("Introducing Contacts")).toBeVisible();

    fireEvent.click(screen.getByTestId("contacts-feature-introduction-secondary"));

    expect(onDismissFeatureIntroduction).toHaveBeenCalledTimes(1);
  });

  it("shows the Ledger Sync introduction over the Contacts page and dismisses it", () => {
    const onDismissIntroduction = jest.fn();

    renderContactsPage({
      ledgerSyncStatus: "inactive",
      isIntroductionOpen: true,
      onDismissIntroduction,
    });

    expect(screen.getByTestId("contacts-list")).toBeVisible();
    expect(
      screen.getByText(
        "Your contacts are end-to-end encrypted with your Ledger and synced across your devices, only you can unlock them.",
      ),
    ).toBeVisible();

    fireEvent.click(screen.getByText("Got it"));

    expect(onDismissIntroduction).toHaveBeenCalledTimes(1);
  });

  it("updates the search input and delegates query changes", () => {
    const onSearchInputChange = jest.fn();

    renderContactsPage({ onSearchInputChange });

    fireEvent.change(screen.getByTestId("contacts-list-search"), {
      target: { value: "Ben" },
    });

    expect(onSearchInputChange).toHaveBeenCalledTimes(1);
  });

  it("renders matching search results", () => {
    const contacts = mockPopulatedContacts();
    const me = contacts.find(contact => contact.isMe) ?? mockMeContact();

    render(
      <ContactsPage
        viewModel={createContactsSearchViewModel(me, contacts, "ben")}
        labels={labels}
        meAvatarSrc="https://example.com/black/user.png"
        onOpenMe={jest.fn()}
        onOpenContact={jest.fn()}
        onAddContact={jest.fn()}
        searchQuery="ben"
        onSearchInputChange={jest.fn()}
        ledgerSyncStatus="ready"
        featureIntroduction={createClosedContactsFeatureIntroduction()}
        ledgerSyncIntroduction={{
          isOpen: false,
          description: "",
          dismissLabel: "",
          onDismiss: jest.fn(),
        }}
      />,
    );

    const contactsList = screen.getByTestId("contacts-list");

    expect(contactsList).toHaveTextContent("Ben");
    expect(contactsList).not.toHaveTextContent("Ada");
    expect(screen.queryByTestId("contacts-search-no-results")).not.toBeInTheDocument();
  });

  it("renders the no-results state when the search query has no match", () => {
    const contacts = mockPopulatedContacts();
    const me = contacts.find(contact => contact.isMe) ?? mockMeContact();

    render(
      <ContactsPage
        viewModel={createContactsSearchViewModel(me, contacts, "unknown")}
        labels={labels}
        meAvatarSrc="https://example.com/black/user.png"
        onOpenMe={jest.fn()}
        onOpenContact={jest.fn()}
        onAddContact={jest.fn()}
        searchQuery="unknown"
        onSearchInputChange={jest.fn()}
        ledgerSyncStatus="ready"
        featureIntroduction={createClosedContactsFeatureIntroduction()}
        ledgerSyncIntroduction={{
          isOpen: false,
          description: "",
          dismissLabel: "",
          onDismiss: jest.fn(),
        }}
      />,
    );

    const contactsList = screen.getByTestId("contacts-list");

    expect(screen.getByTestId("contacts-search-no-results")).toBeVisible();
    expect(screen.getByText("No contact found")).toBeVisible();
    expect(contactsList).not.toHaveTextContent("Ben");
  });
});
