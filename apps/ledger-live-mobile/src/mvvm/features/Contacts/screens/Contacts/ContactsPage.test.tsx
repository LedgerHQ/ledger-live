import React from "react";
import { mockMeContact } from "@domain/entity-contact/schema.mock";
import { ContactsPage, createEmptyContactsListViewModel } from "@features/flow-contacts";
import { render, screen } from "@tests/test-renderer";

function renderContactsPage(ledgerSyncStatus: "ready" | "checking") {
  const me = mockMeContact();
  const onOpenContact = jest.fn();
  const onAddContact = jest.fn();
  const result = render(
    <ContactsPage
      viewModel={createEmptyContactsListViewModel(me)}
      labels={{
        title: "Contacts",
        searchPlaceholder: "Search contact",
        addContact: "Add contact",
        ledgerSyncCheckingAccessibilityLabel: "Checking Ledger Sync status",
        formatAddressCount: count => `${count} address`,
      }}
      meAvatarSrc="https://example.com/avatar.png"
      onOpenContact={onOpenContact}
      onAddContact={onAddContact}
      ledgerSyncStatus={ledgerSyncStatus}
      ledgerSyncIntroduction={{
        isOpen: false,
        description: "Contacts are encrypted.",
        dismissLabel: "Not now",
        onDismiss: jest.fn(),
      }}
    />,
  );

  return { ...result, me, onOpenContact, onAddContact };
}

describe("ContactsPage", () => {
  it("should keep the native Contacts list interactive when Ledger Sync is ready", async () => {
    const { user, me, onOpenContact, onAddContact } = renderContactsPage("ready");

    expect(screen.getByTestId("contacts-screen")).toBeVisible();
    expect(screen.getByTestId("contacts-content")).toHaveProp("pointerEvents", "auto");
    expect(screen.queryByTestId("contacts-ledger-sync-loading")).toBeNull();

    await user.press(screen.getByTestId("contacts-me-item"));
    await user.press(screen.getByTestId("contacts-add-contact-row"));

    expect(onOpenContact).toHaveBeenCalledWith(me.id);
    expect(onAddContact).toHaveBeenCalledTimes(1);
  });

  it("should block the native Contacts list while Ledger Sync is checking", () => {
    renderContactsPage("checking");
    const contactsContent = screen.UNSAFE_getByProps({ testID: "contacts-content" });

    expect(contactsContent.props).toMatchObject({
      pointerEvents: "none",
      importantForAccessibility: "no-hide-descendants",
      accessibilityElementsHidden: true,
    });
    expect(screen.getByRole("progressbar", { name: "Checking Ledger Sync status" })).toBeVisible();
    expect(screen.getByTestId("contacts-ledger-sync-loading")).toHaveProp("accessibilityState", {
      busy: true,
    });
    expect(screen.getByTestId("contacts-ledger-sync-spinner")).toBeVisible();
  });
});
