import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("should call onContactPress with the contact when the row is clicked", async () => {
    const user = userEvent.setup();
    const onContactPress = jest.fn();
    const contact = mockContact({ id: "contact-ada", name: "Ada" });
    renderView({ isEmpty: false, rows: [{ contact, transactionCount: 0 }], onContactPress });

    await user.click(screen.getByTestId("pay-contacts-tile-contact-ada"));

    expect(onContactPress).toHaveBeenCalledTimes(1);
    expect(onContactPress).toHaveBeenCalledWith(contact);
  });

  it("should call onContactPress once from the Telegram action without firing the row twice", async () => {
    const user = userEvent.setup();
    const onContactPress = jest.fn();
    const contact = mockContact({ id: "contact-ada", name: "Ada" });
    renderView({ isEmpty: false, rows: [{ contact, transactionCount: 0 }], onContactPress });

    await user.click(screen.getByTestId("pay-contacts-pay-action-contact-ada"));

    expect(onContactPress).toHaveBeenCalledTimes(1);
    expect(onContactPress).toHaveBeenCalledWith(contact);
  });

  it("should expose View contact in the overflow menu and call onViewContact", async () => {
    const user = userEvent.setup();
    const onViewContact = jest.fn();
    const contact = mockContact({ id: "contact-ada", name: "Ada" });
    renderView({ isEmpty: false, rows: [{ contact, transactionCount: 0 }], onViewContact });

    await user.click(screen.getByTestId("pay-contacts-more-action-contact-ada"));
    await user.click(screen.getByTestId("pay-contacts-view-contact-contact-ada"));

    expect(onViewContact).toHaveBeenCalledTimes(1);
    expect(onViewContact).toHaveBeenCalledWith(contact);
  });
});
