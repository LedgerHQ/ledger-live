import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { createContactCreationPort } from "@features/flow-contacts-add-contact";
import { Contacts } from "../Contacts.web";
import {
  emptyStateLabels,
  makeAddContactProps,
  makeContactsStore,
  renderAddresses,
  renderWithContacts,
  tableLabels,
} from "./shared";

function renderContacts(
  contacts: Parameters<typeof renderWithContacts>[0],
  addContact = makeAddContactProps(),
  store?: Parameters<typeof renderWithContacts>[2],
) {
  return renderWithContacts(
    contacts,
    <Contacts
      title="Pay contact"
      emptyState={emptyStateLabels}
      addContact={addContact}
      labels={tableLabels}
      renderAddresses={renderAddresses}
    />,
    store,
  );
}

describe("Contacts (Web)", () => {
  it("should render the empty state when the store holds no saved contact", () => {
    renderContacts([mockMeContact()]);

    expect(screen.getByTestId("pay-contacts-empty-state")).toBeVisible();
    expect(screen.getByText("You don’t have contact yet")).toBeVisible();
    expect(screen.queryByTestId("pay-contacts-list")).not.toBeInTheDocument();
  });

  it("should open the add-contact dialog from the empty-state CTA", async () => {
    const user = userEvent.setup();
    renderContacts([mockMeContact()]);

    expect(screen.queryByTestId("contacts-add-contact-dialog")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("pay-contacts-add-contact"));

    expect(screen.getByTestId("contacts-add-contact-dialog")).toBeVisible();
  });

  it("should not open the dialog when the injected gate refuses", async () => {
    const user = userEvent.setup();
    const onRequestAddContact = jest.fn();
    renderContacts([mockMeContact()], makeAddContactProps({ onRequestAddContact }));

    await user.click(screen.getByTestId("pay-contacts-add-contact"));

    expect(onRequestAddContact).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("contacts-add-contact-dialog")).not.toBeInTheDocument();
  });

  it("should save a contact from the dialog and persist it to the store", async () => {
    const user = userEvent.setup();
    const store = makeContactsStore([mockMeContact()]);
    const addContact = makeAddContactProps({
      contactCreation: createContactCreationPort({
        dispatch: store.dispatch,
        generateId: () => "coinbase-1",
      }),
    });
    renderContacts([mockMeContact()], addContact, store);

    await user.click(screen.getByTestId("pay-contacts-add-contact"));
    await user.type(screen.getByTestId("contacts-add-contact-name-input"), "Coinbase 1");

    const save = screen.getByTestId("contacts-add-contact-save");
    await waitFor(() => expect(save).toBeEnabled());
    await user.click(save);

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-add-contact-dialog")).not.toBeInTheDocument();
    });
    expect(store.getState().contacts.contacts.some(c => c.name === "Coinbase 1")).toBe(true);
  });

  it("should list saved contacts when they exist", () => {
    renderContacts([mockMeContact(), mockContact({ id: "contact-ada", name: "Ada" })]);

    expect(screen.queryByTestId("pay-contacts-empty-state")).not.toBeInTheDocument();
    expect(screen.getByTestId("pay-contacts-tile-contact-ada")).toBeVisible();
  });
});
