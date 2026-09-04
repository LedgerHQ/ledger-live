import React from "react";
import { screen } from "@testing-library/react";
import { mockContact } from "@domain/entity-contact/schema.mock";
import { ContactsView } from "../ContactsView.web";
import { makeContactsViewProps, renderWithContacts } from "./shared";
import type { ContactsViewProps } from "../../../types";

function renderView(props: Partial<ContactsViewProps> = {}) {
  return renderWithContacts([], <ContactsView {...makeContactsViewProps(props)} />);
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
    expect(screen.queryByTestId("pay-contacts-list")).not.toBeInTheDocument();
  });

  it("should not render the empty state when isEmpty is false", () => {
    renderView({ isEmpty: false });

    expect(screen.queryByTestId("pay-contacts-empty-state")).not.toBeInTheDocument();
  });

  it("should render a table row for each contact when not empty", () => {
    renderView({
      isEmpty: false,
      rows: [
        { contact: mockContact({ id: "contact-ada", name: "Ada" }), transactionCount: 0 },
        { contact: mockContact({ id: "contact-bob", name: "Bob" }), transactionCount: 0 },
      ],
    });

    expect(screen.getByTestId("pay-contacts-list")).toBeVisible();
    expect(screen.getByText("Ada")).toBeVisible();
    expect(screen.getByText("Bob")).toBeVisible();
    expect(screen.getAllByTestId(/^pay-contacts-tile-/)).toHaveLength(2);
  });

  it("should render the closed add-contact dialog without showing it", () => {
    renderView();

    expect(screen.queryByTestId("contacts-add-contact-dialog")).not.toBeInTheDocument();
  });
});
