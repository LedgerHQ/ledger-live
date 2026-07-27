import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import type { ContactDetailLabels } from "./types";
import { ContactDetailView } from "./ContactDetailView.web";

const labels: ContactDetailLabels = {
  addAddress: "Add address",
  emptyMeTitle: "No saved addresses for you",
  emptyContactTitle: name => `No saved addresses for ${name}`,
  emptyMeDescription: "Save your wallet addresses to receive crypto by name next time.",
  emptyContactDescription: () =>
    "Save their wallet addresses to send to them by name next time.",
  formatAddressCount: count => `${count} address`,
};

const onAddAddress = () => undefined;

const defaultProps = {
  labels,
  meAvatarSrc: "https://example.com/avatar.png",
  onAddAddress,
};

describe("ContactDetailView", () => {
  it("should render the Me empty state", () => {
    render(<ContactDetailView {...defaultProps} contact={mockMeContact()} />);

    expect(screen.getByTestId("contacts-detail-me-avatar")).toBeInTheDocument();
    expect(screen.getByText("No saved addresses for you")).toBeInTheDocument();
    expect(
      screen.getByText("Save your wallet addresses to receive crypto by name next time."),
    ).toBeInTheDocument();
  });

  it("should render a saved contact empty state", () => {
    render(
      <ContactDetailView
        {...defaultProps}
        contact={mockContact({ id: "contact-benoit", name: "Benoit" })}
      />,
    );

    expect(screen.getByTestId("contacts-detail-avatar")).toBeInTheDocument();
    expect(screen.getByText("Benoit")).toBeInTheDocument();
    expect(screen.getByText("No saved addresses for Benoit")).toBeInTheDocument();
    expect(
      screen.getByText("Save their wallet addresses to send to them by name next time."),
    ).toBeInTheDocument();
  });

  it("should request adding an address when the action is pressed", () => {
    const handleAddAddress = jest.fn();
    render(
      <ContactDetailView
        {...defaultProps}
        contact={mockMeContact()}
        onAddAddress={handleAddAddress}
      />,
    );

    fireEvent.click(screen.getByTestId("contacts-detail-add-address"));

    expect(handleAddAddress).toHaveBeenCalledTimes(1);
  });
});
