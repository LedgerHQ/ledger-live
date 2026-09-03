import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithStyle } from "../../../__tests__/renderWithStyle.web";
import { EmptyState } from "../EmptyState.web";
import type { EmptyStateProps } from "../../../types";

const defaultProps: EmptyStateProps = {
  info: "No contacts yet",
  addContactLabel: "Add contact",
  onAddContact: jest.fn(),
};

describe("EmptyState (Web)", () => {
  it("should render the empty info and CTA", () => {
    renderWithStyle(<EmptyState {...defaultProps} />);

    expect(screen.getByTestId("pay-contacts-empty-state")).toBeVisible();
    expect(screen.getByText("No contacts yet")).toBeVisible();
    expect(screen.getByText("Add contact")).toBeVisible();
  });

  it("should call onAddContact when the CTA is clicked", () => {
    const onAddContact = jest.fn();
    renderWithStyle(<EmptyState {...defaultProps} onAddContact={onAddContact} />);

    fireEvent.click(screen.getByTestId("pay-contacts-add-contact"));

    expect(onAddContact).toHaveBeenCalledTimes(1);
  });
});
