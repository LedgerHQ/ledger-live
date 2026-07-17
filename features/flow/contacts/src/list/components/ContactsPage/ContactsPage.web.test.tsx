import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ContactId } from "@domain/entity-contact";
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
  formatAddressCount: (count: number) => `${count} address`,
};

type RenderContactsPageOptions = Readonly<{
  viewModel?: ContactsPageViewModel;
  ledgerSyncStatus?: ContactsLedgerSyncStatus;
  isIntroductionOpen?: boolean;
  onDismissIntroduction?: () => void;
  onOpenMe?: (contactId: ContactId) => void;
  onOpenContact?: (contactId: ContactId) => void;
  onAddContact?: () => void;
  searchQuery?: string;
  onSearchInputChange?: React.ChangeEventHandler<HTMLInputElement>;
}>;

function renderContactsPage({
  viewModel = createEmptyContactsListViewModel(mockMeContact()),
  ledgerSyncStatus = "ready",
  isIntroductionOpen = false,
  onDismissIntroduction = jest.fn(),
  onOpenMe = jest.fn(),
  onOpenContact = jest.fn(),
  onAddContact = jest.fn(),
  searchQuery = "",
  onSearchInputChange = jest.fn(),
}: RenderContactsPageOptions = {}) {
  render(
    <ContactsPage
      viewModel={viewModel}
      labels={labels}
      meAvatarSrc="https://example.com/black/user.png"
      onOpenMe={onOpenMe}
      onOpenContact={onOpenContact}
      onAddContact={onAddContact}
      searchQuery={searchQuery}
      onSearchInputChange={onSearchInputChange}
      ledgerSyncStatus={ledgerSyncStatus}
      ledgerSyncIntroduction={{
        isOpen: isIntroductionOpen,
        description:
          "Your contacts are end-to-end encrypted with your Ledger and synced across your devices, only you can unlock them.",
        dismissLabel: "Got it",
        onDismiss: onDismissIntroduction,
      }}
    />,
  );

  return { onDismissIntroduction, onOpenMe, onOpenContact, onAddContact, onSearchInputChange };
}

describe("ContactsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the empty contacts list inside the page and delegates row actions", () => {
    const { onOpenMe, onOpenContact, onAddContact } = renderContactsPage();

    expect(screen.getByTestId("contacts-page-layout")).toBeVisible();
    expect(screen.getByTestId("contacts-page-header")).toBeVisible();
    expect(screen.getByTestId("contacts-list-pane")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-pane").childElementCount).toBe(0);
    expect(screen.getByTestId("contacts-list")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Contacts" })).toBeVisible();
    expect((screen.getByPlaceholderText("Search contact") as HTMLInputElement).value).toBe("");
    expect(screen.getByText("Me")).toBeVisible();
    expect(screen.getByText("0 address")).toBeVisible();
    const meAvatar = screen.getByTestId("contacts-me-avatar");
    expect(meAvatar).toHaveAttribute("aria-hidden", "true");
    expect(meAvatar.querySelector("img")?.getAttribute("src")).toBe(
      "https://example.com/black/user.png",
    );
    expect(screen.queryByTestId("contacts-section-A")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("contacts-me-row"));
    fireEvent.click(screen.getByTestId("contacts-add-contact"));
    fireEvent.click(screen.getByTestId("contacts-add-contact-header"));

    expect(onOpenMe).toHaveBeenCalledWith("contact-me");
    expect(onOpenContact).not.toHaveBeenCalled();
    expect(onAddContact).toHaveBeenCalledTimes(2);
  });

  it("renders saved contacts in alphabetical sections and delegates row actions", () => {
    const onOpenContact = jest.fn();
    const onAddContact = jest.fn();
    const contacts = mockPopulatedContacts();
    const me = contacts.find(contact => contact.isMe) ?? mockMeContact();

    renderContactsPage({
      viewModel: createPopulatedContactsListViewModel(me, contacts),
      onOpenContact,
      onAddContact,
    });

    expect(screen.getByTestId("contacts-section-A")).toBeVisible();
    expect(screen.getByTestId("contacts-section-B")).toBeVisible();
    expect(screen.getByTestId("contacts-section-O")).toBeVisible();
    expect(screen.getByTestId("contacts-saved-row-contact-ada")).toHaveTextContent("Ada");
    expect(screen.getByTestId("contacts-saved-row-contact-ada")).toHaveTextContent("0 address");
    expect(screen.getByTestId("contacts-saved-row-contact-ben")).toHaveTextContent("Ben");
    expect(screen.getByTestId("contacts-saved-row-contact-ben")).toHaveTextContent("2 address");
    expect(screen.getByTestId("contacts-saved-row-contact-olive")).toHaveTextContent("Olive");
    expect(screen.getByTestId("contacts-saved-avatar-contact-ada")).toHaveTextContent("A");
    expect(screen.getByTestId("contacts-add-contact")).toBeVisible();
    expect(screen.getByTestId("contacts-add-contact-header")).toBeVisible();

    fireEvent.click(screen.getByTestId("contacts-saved-row-contact-ben"));

    expect(onOpenContact).toHaveBeenCalledWith("contact-ben");
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

    fireEvent.click(screen.getByRole("button", { name: "Got it" }));

    expect(onDismissIntroduction).toHaveBeenCalledTimes(1);
  });

  it("dismisses the Ledger Sync introduction from the dialog header", () => {
    const onDismissIntroduction = jest.fn();

    renderContactsPage({
      ledgerSyncStatus: "inactive",
      isIntroductionOpen: true,
      onDismissIntroduction,
    });

    fireEvent.click(screen.getByLabelText("components.dialogHeader.closeAriaLabel"));

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
        ledgerSyncIntroduction={{
          isOpen: false,
          description: "",
          dismissLabel: "",
          onDismiss: jest.fn(),
        }}
      />,
    );

    expect(screen.getByTestId("contacts-saved-row-contact-ben")).toBeVisible();
    expect(screen.queryByTestId("contacts-saved-row-contact-ada")).not.toBeInTheDocument();
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
        ledgerSyncIntroduction={{
          isOpen: false,
          description: "",
          dismissLabel: "",
          onDismiss: jest.fn(),
        }}
      />,
    );

    expect(screen.getByTestId("contacts-search-no-results")).toBeVisible();
    expect(screen.getByText("No contact found")).toBeVisible();
    expect(screen.queryByTestId("contacts-saved-row-contact-ben")).not.toBeInTheDocument();
  });
});
