import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import type { ContactDetailLabels } from "../../types";
import { ContactDetailPage } from "./ContactDetailPage.native";

const labels: ContactDetailLabels = {
  addAddress: "Add address",
  emptyStateTitle: "No address yet",
  emptyMeDescription: "Save a wallet address to receive crypto.",
  formatEmptyContactDescription: name => `Save wallet address to send to ${name}`,
  formatAddressCount: count => `${count} address`,
};

const onAddAddress = () => undefined;

const defaultProps = {
  labels,
  meAvatarSrc: "https://example.com/avatar.png",
  onAddAddress,
};

describe("ContactDetailPage", () => {
  it("should render the Me empty state", () => {
    render(<ContactDetailPage {...defaultProps} contact={mockMeContact()} />);

    expect(screen.getByTestId("contacts-detail-me-avatar")).toBeVisible();
    expect(screen.getByText("No address yet")).toBeVisible();
    expect(screen.getByText("Save a wallet address to receive crypto.")).toBeVisible();
  });

  it("should render a saved contact empty state", () => {
    render(
      <ContactDetailPage
        {...defaultProps}
        contact={mockContact({ id: "contact-benoit", name: "Benoit" })}
      />,
    );

    expect(screen.getByTestId("contacts-detail-avatar")).toBeVisible();
    expect(screen.getByText("Benoit")).toBeVisible();
    expect(screen.getByText("Save wallet address to send to Benoit")).toBeVisible();
  });

  it("should request adding an address when the action is pressed", () => {
    const onAddAddress = jest.fn();
    render(
      <ContactDetailPage {...defaultProps} contact={mockMeContact()} onAddAddress={onAddAddress} />,
    );

    fireEvent.press(screen.getByTestId("contacts-detail-add-address"));

    expect(onAddAddress).toHaveBeenCalledTimes(1);
  });
});
