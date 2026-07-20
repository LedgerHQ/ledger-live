import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ContactId } from "@domain/entity-contact";
import { mockMeContact } from "@domain/entity-contact/schema.mock";
import type { ContactsLedgerSyncStatus } from "../../types";
import { createEmptyContactsListViewModel } from "../../viewModel";
import { ContactsPage } from "./ContactsPage.web";

type RenderContactsPageOptions = Readonly<{
  ledgerSyncStatus?: ContactsLedgerSyncStatus;
  isIntroductionOpen?: boolean;
  onDismissIntroduction?: () => void;
  onOpenContact?: (contactId: ContactId) => void;
  onAddContact?: () => void;
}>;

function renderContactsPage({
  ledgerSyncStatus = "ready",
  isIntroductionOpen = false,
  onDismissIntroduction = jest.fn(),
  onOpenContact = jest.fn(),
  onAddContact = jest.fn(),
}: RenderContactsPageOptions = {}) {
  render(
    <ContactsPage
      viewModel={createEmptyContactsListViewModel(mockMeContact())}
      labels={{
        title: "Contacts",
        searchPlaceholder: "Search contact",
        addContact: "Add contact",
        formatAddressCount: count => `${count} address`,
      }}
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

    fireEvent.click(screen.getByTestId("contacts-me-row"));
    fireEvent.click(screen.getByTestId("contacts-add-contact"));
    fireEvent.click(screen.getByTestId("contacts-add-contact-header"));

    expect(onOpenContact).toHaveBeenCalledWith("contact-me");
    expect(onAddContact).toHaveBeenCalledTimes(2);
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
