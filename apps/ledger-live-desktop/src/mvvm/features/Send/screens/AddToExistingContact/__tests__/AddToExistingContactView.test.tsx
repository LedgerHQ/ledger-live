/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { createPopulatedContactsListViewModel } from "@features/flow-contacts-list";
import { AddToExistingContactView } from "../AddToExistingContactView";

const me = mockMeContact();
const ada = mockContact({ id: "contact-ada", name: "Ada" });
const viewModel = createPopulatedContactsListViewModel(me, [me, ada]);

describe("AddToExistingContactView", () => {
  it("should render the searchable contacts list", () => {
    render(
      <AddToExistingContactView
        viewModel={viewModel}
        searchQuery=""
        searchPlaceholder="Search contact"
        searchNoResults="No contact found"
        formatAddressCount={count => `${count} address`}
        meAvatarSrc="https://example.com/me.png"
        isOpeningAddressFlow={false}
        onSearchInputChange={jest.fn()}
        onSelectContact={jest.fn()}
      />,
    );

    expect(screen.getByTestId("send-add-to-existing-contact-step")).toBeVisible();
    expect(screen.getByTestId("contacts-list-search")).toBeVisible();
    expect(screen.getByTestId("contacts-me-row")).toBeVisible();
    expect(screen.getByTestId("contacts-saved-row-contact-ada")).toBeVisible();
    expect(screen.getByText("Ada")).toBeVisible();
  });

  it("should select a saved contact when its row is clicked", async () => {
    const onSelectContact = jest.fn();
    const { user } = render(
      <AddToExistingContactView
        viewModel={viewModel}
        searchQuery=""
        searchPlaceholder="Search contact"
        searchNoResults="No contact found"
        formatAddressCount={count => `${count} address`}
        meAvatarSrc="https://example.com/me.png"
        isOpeningAddressFlow={false}
        onSearchInputChange={jest.fn()}
        onSelectContact={onSelectContact}
      />,
    );

    await user.click(screen.getByTestId("contacts-saved-row-contact-ada"));

    expect(onSelectContact).toHaveBeenCalledWith(ada.id);
  });
});
