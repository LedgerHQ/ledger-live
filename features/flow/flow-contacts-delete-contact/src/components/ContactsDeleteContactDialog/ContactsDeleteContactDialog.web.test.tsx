import React from "react";
import { render, screen } from "@testing-library/react";
import { I18nTestProvider } from "@shared/i18n/testing";
import { ContactsDeleteContactDialog } from "./ContactsDeleteContactDialog";

describe("ContactsDeleteContactDialog", () => {
  it("resolves the confirmation copy", () => {
    render(
      <ContactsDeleteContactDialog
        isOpen
        isDeleting={false}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
      { wrapper: I18nTestProvider },
    );

    expect(screen.getByText("contacts.deleteContact.title")).toBeInTheDocument();
    expect(screen.getByText("contacts.deleteContact.description")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-delete-contact-confirm")).toHaveTextContent(
      "contacts.deleteContact.confirm",
    );
  });
});
