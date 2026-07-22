import React from "react";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import {
  ContactsPage,
  createClosedContactsFeatureIntroduction,
  createEmptyContactsListViewModel,
  createPopulatedContactsListViewModel,
  type ContactsListViewModel,
} from "@features/flow-contacts";
import { render, screen } from "@tests/test-renderer";

function renderContactsPage(
  ledgerSyncStatus: "ready" | "checking",
  viewModel?: ContactsListViewModel,
) {
  const me = mockMeContact();
  const onOpenContact = jest.fn();
  const onAddContact = jest.fn();
  const result = render(
    <ContactsPage
      viewModel={viewModel ?? createEmptyContactsListViewModel(me)}
      labels={{
        title: "Contacts",
        searchPlaceholder: "Search contact",
        searchNoResults: "No contact found",
        addContact: "Add contact",
        ledgerSyncCheckingAccessibilityLabel: "Checking Ledger Sync status",
        formatAddressCount: count => `${count} address`,
      }}
      meAvatarSrc="https://example.com/avatar.png"
      searchQuery=""
      onSearchQueryChange={jest.fn()}
      onOpenContact={onOpenContact}
      onAddContact={onAddContact}
      ledgerSyncStatus={ledgerSyncStatus}
      featureIntroduction={createClosedContactsFeatureIntroduction()}
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

  it("should keep the search input outside the populated Contacts list", () => {
    const me = mockMeContact();
    const viewModel = createPopulatedContactsListViewModel(me, [
      me,
      mockContact({ id: "contact-ada", name: "Ada" }),
    ]);

    renderContactsPage("ready", viewModel);

    const searchInput = screen.getByTestId("contacts-search-input");
    const fixedSearch = screen.getByTestId("contacts-fixed-search");

    expect(fixedSearch).toBeVisible();
    expect(fixedSearch).toHaveStyle({ paddingBottom: 16, position: "absolute", zIndex: 2 });
    expect(screen.getByTestId("contacts-fixed-search-spacer")).toHaveStyle({ height: 64 });
    expect(searchInput).toBeVisible();
    expect(screen.getByTestId("contacts-list")).toBeVisible();
    expect(screen.getByTestId("contacts-list-header")).not.toContainElement(searchInput);
  });
});
