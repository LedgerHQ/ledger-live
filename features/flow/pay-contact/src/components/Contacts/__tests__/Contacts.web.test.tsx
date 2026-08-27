import React from "react";
import { screen } from "@testing-library/react";
import { mockMeContact } from "@domain/entity-contact/schema.mock";
import { Contacts } from "../Contacts.web";
import { renderWithContacts } from "./shared";
import type { ContactsProps } from "../../../types";

const emptyState: ContactsProps["emptyState"] = {
  info: "You don’t have contact yet",
  addContactLabel: "Add contact",
  onAddContact: jest.fn(),
};

function renderContacts(contacts: Parameters<typeof renderWithContacts>[0]) {
  return renderWithContacts(contacts, <Contacts title="Pay contact" emptyState={emptyState} />);
}

describe("Contacts (Web)", () => {
  it("should render the empty state when the store holds no saved contact", () => {
    renderContacts([mockMeContact()]);

    expect(screen.getByTestId("pay-contacts-empty-state")).toBeVisible();
    expect(screen.getByText("You don’t have contact yet")).toBeVisible();
    expect(screen.queryByTestId("contacts-table")).not.toBeInTheDocument();
  });
});
