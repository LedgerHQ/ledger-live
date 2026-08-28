import React from "react";
import { render, screen, userEvent } from "@tests/test-renderer";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { createPopulatedContactsListViewModel } from "@features/flow-contacts-list";
import { SelectContactStep } from "../SelectContactStep";

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  const RN = jest.requireActual("react-native");

  return {
    ...actual,
    BottomSheetHeader: ({ title }: { title?: string }) =>
      title ? <RN.Text>{title}</RN.Text> : null,
    BottomSheetView: ({ children, testID }: { children?: React.ReactNode; testID?: string }) => (
      <RN.View testID={testID}>{children}</RN.View>
    ),
  };
});

const me = mockMeContact();
const ada = mockContact({ id: "contact-ada", name: "Ada" });
const viewModel = createPopulatedContactsListViewModel(me, [me, ada]);
const labels = {
  title: "Select contact",
  searchPlaceholder: "Search contact",
  searchNoResults: "No contact found",
  addContact: "Add contact",
  formatAddressCount: (count: number) => `${count} address`,
};

describe("SelectContactStep", () => {
  it("should render the searchable contacts list", () => {
    render(
      <SelectContactStep
        title="Select contact"
        viewModel={viewModel}
        labels={labels}
        meAvatarSrc="https://example.com/me.png"
        searchQuery=""
        onSearchQueryChange={jest.fn()}
        onOpenContact={jest.fn()}
        onAddContact={jest.fn()}
        isOpeningAddressFlow={false}
      />,
    );

    expect(screen.getByTestId("send-add-to-existing-contact-step")).toBeVisible();
    expect(screen.getByText("Select contact")).toBeVisible();
    expect(screen.getByTestId("contacts-me-item")).toBeVisible();
    expect(screen.getByTestId("contacts-saved-contact-contact-ada")).toBeVisible();
  });

  it("should select a saved contact when its row is pressed", async () => {
    const onOpenContact = jest.fn();
    const user = userEvent.setup();
    render(
      <SelectContactStep
        title="Select contact"
        viewModel={viewModel}
        labels={labels}
        meAvatarSrc="https://example.com/me.png"
        searchQuery=""
        onSearchQueryChange={jest.fn()}
        onOpenContact={onOpenContact}
        onAddContact={jest.fn()}
        isOpeningAddressFlow={false}
      />,
    );

    await user.press(screen.getByTestId("contacts-saved-contact-contact-ada"));

    expect(onOpenContact).toHaveBeenCalledWith(ada.id);
  });
});
