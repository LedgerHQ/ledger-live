import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { createPopulatedContactsListViewModel } from "../../viewModel";
import { ContactsPage } from "./ContactsPage.native";

const labels = {
  title: "Contacts",
  searchPlaceholder: "Search contact",
  addContact: "Add contact",
  formatAddressCount: (count: number) => `${count} address${count === 1 ? "" : "es"}`,
};

describe("ContactsPage (Native)", () => {
  it("renders the populated Contacts list and delegates saved-contact actions", () => {
    const onOpenContact = jest.fn();
    const me = mockMeContact();
    const viewModel = createPopulatedContactsListViewModel(me, [
      me,
      mockContact({ id: "contact-ada", name: "Ada" }),
    ]);

    render(
      <ContactsPage
        viewModel={viewModel}
        labels={labels}
        meAvatarSrc="https://example.com/avatar.png"
        onOpenContact={onOpenContact}
        onAddContact={jest.fn()}
      />,
    );

    expect(screen.getByTestId("contacts-list")).toBeVisible();
    expect(screen.getByTestId("contacts-me-item")).toBeVisible();
    expect(screen.getByTestId("contacts-section-A")).toBeVisible();
    expect(screen.getByTestId("contacts-saved-contact-contact-ada")).toBeVisible();
    expect(screen.getByTestId("contacts-initial-avatar-contact-ada")).toBeVisible();

    fireEvent.press(screen.getByTestId("contacts-me-item"));
    fireEvent.press(screen.getByTestId("contacts-saved-contact-contact-ada"));

    expect(onOpenContact).toHaveBeenNthCalledWith(1, "contact-me");
    expect(onOpenContact).toHaveBeenNthCalledWith(2, "contact-ada");
  });

  it("renders the empty Contacts list and delegates the add-contact action", () => {
    const onAddContact = jest.fn();
    const me = mockMeContact();

    render(
      <ContactsPage
        viewModel={{
          displayMode: "empty",
          me: {
            contactId: me.id,
            name: me.name,
            initial: "M",
            addressCount: 0,
          },
        }}
        labels={labels}
        meAvatarSrc="https://example.com/avatar.png"
        onOpenContact={jest.fn()}
        onAddContact={onAddContact}
      />,
    );

    expect(screen.getByTestId("contacts-add-contact-row")).toBeVisible();

    fireEvent.press(screen.getByTestId("contacts-add-contact-row"));

    expect(onAddContact).toHaveBeenCalledTimes(1);
  });
});
