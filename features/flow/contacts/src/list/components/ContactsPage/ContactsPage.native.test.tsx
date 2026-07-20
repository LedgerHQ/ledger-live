import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { createContactsSearchViewModel } from "../../viewModel";
import { ContactsPage } from "./ContactsPage.native";

jest.mock("react-native", () => {
  const React = require("react");

  return {
    View: ({ children, ...props }: { children: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
    SectionList: ({
      testID,
      sections,
      renderItem,
      renderSectionHeader,
      ListHeaderComponent,
      keyboardDismissMode,
      keyboardShouldPersistTaps,
    }: {
      testID: string;
      sections: readonly { title: string; data: readonly { contactId: string }[] }[];
      renderItem: ({ item }: { item: { contactId: string } }) => React.ReactNode;
      renderSectionHeader: ({ section }: { section: { title: string } }) => React.ReactNode;
      ListHeaderComponent: React.ReactNode;
      keyboardDismissMode?: string;
      keyboardShouldPersistTaps?: string;
    }) => (
      <div
        data-testid={testID}
        data-keyboard-dismiss-mode={keyboardDismissMode}
        data-keyboard-should-persist-taps={keyboardShouldPersistTaps}
      >
        {ListHeaderComponent}
        {sections.map(section => (
          <React.Fragment key={section.title}>
            {renderSectionHeader({ section })}
            {section.data.map(item => (
              <React.Fragment key={item.contactId}>{renderItem({ item })}</React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </div>
    ),
  };
});

jest.mock("@ledgerhq/lumen-ui-rnative", () => ({
  Box: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
    <div data-testid={testID}>{children}</div>
  ),
  SearchInput: ({
    testID,
    value,
    onChangeText,
    onClear,
    placeholder,
  }: {
    testID: string;
    value: string;
    onChangeText: (query: string) => void;
    onClear: () => void;
    placeholder: string;
  }) => (
    <>
      <input
        data-testid={testID}
        value={value}
        placeholder={placeholder}
        onChange={event => onChangeText(event.target.value)}
      />
      <button type="button" onClick={onClear}>
        Clear
      </button>
    </>
  ),
  Spot: () => <div />,
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

jest.mock("@ledgerhq/lumen-ui-rnative/symbols", () => ({ Search: "Search" }));

jest.mock("./ContactsMeListItem.native", () => ({
  ContactsMeListItem: ({ contact }: { contact: { name: string } }) => <span>{contact.name}</span>,
}));

jest.mock("./ContactsAddContactListItem.native", () => ({
  ContactsAddContactListItem: ({ label }: { label: string }) => (
    <span data-testid="contacts-add-contact-row">{label}</span>
  ),
}));

jest.mock("./ContactsSavedContactListItem.native", () => ({
  ContactsSavedContactListItem: ({ contact }: { contact: { name: string } }) => (
    <span>{contact.name}</span>
  ),
}));

jest.mock("./ContactsSectionHeader.native", () => ({
  ContactsSectionHeader: ({ title }: { title: string }) => <span>{title}</span>,
}));

const labels = {
  title: "Contacts",
  searchPlaceholder: "Search contact",
  searchNoResults: "No contact found",
  addContact: "Add contact",
  formatAddressCount: (count: number) => `${count} address`,
};

function renderContactsPage(query: string) {
  const me = mockMeContact();
  const viewModel = createContactsSearchViewModel(
    me,
    [
      me,
      mockContact({ id: "contact-ada", name: "Ada" }),
      mockContact({ id: "contact-ben", name: "Ben" }),
    ],
    query,
  );
  const onSearchQueryChange = jest.fn();

  render(
    <ContactsPage
      viewModel={viewModel}
      labels={labels}
      searchQuery={query}
      onSearchQueryChange={onSearchQueryChange}
      meAvatarSrc="https://example.com/avatar.png"
      onOpenContact={jest.fn()}
      onAddContact={jest.fn()}
      ledgerSyncStatus="ready"
      ledgerSyncIntroduction={{
        isOpen: false,
        description: "",
        dismissLabel: "",
        onDismiss: jest.fn(),
      }}
    />,
  );

  return { onSearchQueryChange };
}

describe("ContactsPage native", () => {
  it("renders matching contacts and delegates typing and clearing", () => {
    const { onSearchQueryChange } = renderContactsPage("Ada");

    expect(screen.getByTestId("contacts-search-input")).toHaveValue("Ada");
    expect(screen.getByText("Ada")).toBeVisible();
    expect(screen.queryByText("Ben")).toBeNull();
    expect(screen.getByTestId("contacts-list")).toHaveAttribute(
      "data-keyboard-dismiss-mode",
      "on-drag",
    );
    expect(screen.getByTestId("contacts-list")).toHaveAttribute(
      "data-keyboard-should-persist-taps",
      "handled",
    );

    fireEvent.change(screen.getByTestId("contacts-search-input"), { target: { value: "Ben" } });
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(onSearchQueryChange).toHaveBeenNthCalledWith(1, "Ben");
    expect(onSearchQueryChange).toHaveBeenNthCalledWith(2, "");
  });

  it("renders the local no-results state without an add-contact row", () => {
    renderContactsPage("Unknown");

    expect(screen.getByTestId("contacts-search-no-results")).toBeVisible();
    expect(screen.getByText("No contact found")).toBeVisible();
    expect(screen.queryByTestId("contacts-add-contact-row")).toBeNull();
  });
});
