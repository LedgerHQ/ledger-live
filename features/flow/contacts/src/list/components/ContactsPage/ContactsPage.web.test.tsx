import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ContactId } from "@domain/entity-contact";
import { mockMeContact, mockPopulatedContacts } from "@domain/entity-contact/schema.mock";
import type { ContactsLedgerSyncStatus, ContactsListViewModel } from "../../types";
import {
  createEmptyContactsListViewModel,
  createPopulatedContactsListViewModel,
} from "../../viewModel";
import { ContactsPage } from "./ContactsPage.web";

const labels = {
  title: "Contacts",
  searchPlaceholder: "Search contact",
  addContact: "Add contact",
  ledgerSyncCheckingAccessibilityLabel: "Checking Ledger Sync status",
  formatAddressCount: (count: number) => `${count} address`,
};

type RenderContactsPageOptions = Readonly<{
  viewModel?: ContactsListViewModel;
  ledgerSyncStatus?: ContactsLedgerSyncStatus;
  isIntroductionOpen?: boolean;
  onDismissIntroduction?: () => void;
  onOpenContact?: (contactId: ContactId) => void;
  onAddContact?: () => void;
}>;

function renderContactsPage({
  viewModel = createEmptyContactsListViewModel(mockMeContact()),
  ledgerSyncStatus = "ready",
  isIntroductionOpen = false,
  onDismissIntroduction = jest.fn(),
  onOpenContact = jest.fn(),
  onAddContact = jest.fn(),
}: RenderContactsPageOptions = {}) {
  render(
    <ContactsPage
      viewModel={viewModel}
      labels={labels}
      meAvatarSrc="https://example.com/black/user.png"
      onOpenContact={onOpenContact}
      onAddContact={onAddContact}
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

  return { onDismissIntroduction, onOpenContact, onAddContact };
}

describe("ContactsPage", () => {
  it("renders the empty contacts list inside the page and delegates row actions", () => {
    const { onOpenContact, onAddContact } = renderContactsPage();

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

    expect(onOpenContact).toHaveBeenCalledWith("contact-me");
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
});
