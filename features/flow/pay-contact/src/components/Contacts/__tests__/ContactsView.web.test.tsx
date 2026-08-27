import React from "react";
import { screen } from "@testing-library/react";
import { ContactsView } from "../ContactsView.web";
import { renderWithContacts } from "./shared";
import type { ContactsViewProps } from "../../../types";

const emptyState: ContactsViewProps["emptyState"] = {
  info: "You don’t have contact yet",
  addContactLabel: "Add contact",
  onAddContact: jest.fn(),
};

const addContactDialog: ContactsViewProps["addContactDialog"] = {
  isOpen: false,
  isConfirmEnabled: false,
  isSaving: false,
  draftName: "",
  avatarInitial: "",
  invalidNameError: null,
  labels: {
    title: "Add contact",
    namePlaceholder: "Contact name",
    namingDisclaimer: "Use a nickname.",
    confirmName: "Add contact",
    nameValidationErrors: {},
  } as ContactsViewProps["addContactDialog"]["labels"],
  onDraftNameChange: jest.fn(),
  onConfirm: jest.fn(),
  reset: jest.fn(),
  onOpen: jest.fn(),
  onClose: jest.fn(),
};

function renderView(props: Partial<ContactsViewProps> = {}) {
  return renderWithContacts(
    [],
    <ContactsView
      title="Pay contact"
      isEmpty
      emptyState={emptyState}
      addContactDialog={addContactDialog}
      {...props}
    />,
  );
}

describe("ContactsView (Web)", () => {
  it("should always render the section title", () => {
    renderView();

    expect(screen.getByTestId("pay-contacts")).toBeVisible();
    expect(screen.getByText("Pay contact")).toBeVisible();
  });

  it("should render the empty state when isEmpty is true", () => {
    renderView();

    expect(screen.getByTestId("pay-contacts-empty-state")).toBeVisible();
    expect(screen.queryByTestId("contacts-table")).not.toBeInTheDocument();
  });

  it("should not render the empty state when isEmpty is false", () => {
    renderView({ isEmpty: false });

    expect(screen.queryByTestId("pay-contacts-empty-state")).not.toBeInTheDocument();
  });

  it("should render the closed add-contact dialog without showing it", () => {
    renderView();

    expect(screen.queryByTestId("contacts-add-contact-dialog")).not.toBeInTheDocument();
  });
});
