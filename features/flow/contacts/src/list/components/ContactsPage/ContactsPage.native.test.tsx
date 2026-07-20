import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { mockMeContact } from "@domain/entity-contact/schema.mock";
import type { ContactsLedgerSyncStatus } from "../../types";
import { createEmptyContactsListViewModel } from "../../viewModel";
import { ContactsPage } from "./ContactsPage.native";

jest.mock("react-native", () => ({
  SectionList: () => null,
}));

jest.mock("@ledgerhq/lumen-ui-rnative", () => ({
  Box: ({
    children,
    testID,
    pointerEvents,
    importantForAccessibility,
    accessibilityElementsHidden,
    accessibilityLabel,
    accessibilityRole,
    accessibilityState,
    lx: _lx,
    accessible: _accessible,
  }: React.PropsWithChildren<{
    testID?: string;
    pointerEvents?: string;
    importantForAccessibility?: string;
    accessibilityElementsHidden?: boolean;
    accessibilityLabel?: string;
    accessibilityRole?: string;
    accessibilityState?: { busy?: boolean };
    lx?: unknown;
    accessible?: boolean;
  }>) => (
    <div
      data-testid={testID}
      data-pointer-events={pointerEvents}
      data-important-for-accessibility={importantForAccessibility}
      data-accessibility-elements-hidden={accessibilityElementsHidden}
      data-accessibility-busy={accessibilityState?.busy}
      aria-label={accessibilityLabel}
      role={accessibilityRole}
    >
      {children}
    </div>
  ),
  SearchInput: ({
    testID,
    value,
    placeholder,
    accessibilityLabel,
  }: {
    testID: string;
    value: string;
    placeholder: string;
    accessibilityLabel: string;
  }) => (
    <input
      data-testid={testID}
      value={value}
      placeholder={placeholder}
      aria-label={accessibilityLabel}
      readOnly
    />
  ),
  Spinner: ({ testID }: { testID: string }) => <div data-testid={testID} />,
}));

jest.mock("./ContactsMeListItem.native", () => ({
  ContactsMeListItem: ({ onOpen }: { onOpen: (contactId: string) => void }) => (
    <button type="button" data-testid="contacts-me-item" onClick={() => onOpen("contact-me")}>
      Me
    </button>
  ),
}));

jest.mock("./ContactsAddContactListItem.native", () => ({
  ContactsAddContactListItem: ({ label, onPress }: { label: string; onPress: () => void }) => (
    <button type="button" data-testid="contacts-add-contact-row" onClick={onPress}>
      {label}
    </button>
  ),
}));

function renderContactsPage({
  ledgerSyncStatus = "ready",
}: { ledgerSyncStatus?: ContactsLedgerSyncStatus } = {}) {
  const onOpenContact = jest.fn();
  const onAddContact = jest.fn();

  render(
    <ContactsPage
      viewModel={createEmptyContactsListViewModel(mockMeContact())}
      labels={{
        title: "Contacts",
        searchPlaceholder: "Search contact",
        addContact: "Add contact",
        ledgerSyncCheckingAccessibilityLabel: "Checking Ledger Sync status",
        formatAddressCount: count => `${count} address`,
      }}
      meAvatarSrc="https://example.com/black/user.png"
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

  return { onOpenContact, onAddContact };
}

describe("ContactsPage (Native)", () => {
  it("keeps the Contacts list interactive when Ledger Sync is ready", () => {
    const { onOpenContact, onAddContact } = renderContactsPage();

    expect(screen.getByTestId("contacts-screen")).toBeVisible();
    expect(screen.getByTestId("contacts-content")).toHaveAttribute("data-pointer-events", "auto");
    expect(screen.queryByTestId("contacts-ledger-sync-loading")).toBeNull();

    fireEvent.click(screen.getByTestId("contacts-me-item"));
    fireEvent.click(screen.getByTestId("contacts-add-contact-row"));

    expect(onOpenContact).toHaveBeenCalledWith("contact-me");
    expect(onAddContact).toHaveBeenCalledTimes(1);
  });

  it("shows an accessible overlay and blocks the list while Ledger Sync is checking", () => {
    renderContactsPage({ ledgerSyncStatus: "checking" });

    expect(screen.getByTestId("contacts-screen")).toBeVisible();
    expect(screen.getByTestId("contacts-content")).toHaveAttribute("data-pointer-events", "none");
    expect(screen.getByTestId("contacts-content")).toHaveAttribute(
      "data-important-for-accessibility",
      "no-hide-descendants",
    );
    expect(screen.getByTestId("contacts-content")).toHaveAttribute(
      "data-accessibility-elements-hidden",
      "true",
    );
    expect(screen.getByTestId("contacts-ledger-sync-loading")).toHaveAttribute(
      "aria-label",
      "Checking Ledger Sync status",
    );
    expect(screen.getByTestId("contacts-ledger-sync-loading")).toHaveAttribute(
      "role",
      "progressbar",
    );
    expect(screen.getByTestId("contacts-ledger-sync-loading")).toHaveAttribute(
      "data-accessibility-busy",
      "true",
    );
    expect(screen.getByTestId("contacts-ledger-sync-spinner")).toBeVisible();
  });
});
