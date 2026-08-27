import React from "react";
import { screen } from "@testing-library/react";
import { ContactsView } from "../ContactsView.web";
import { renderWithStyle } from "./shared";
import type { ContactsViewProps } from "../../../types";

const emptyState: ContactsViewProps["emptyState"] = {
  info: "You don’t have contact yet",
  addContactLabel: "Add contact",
  onAddContact: jest.fn(),
};

describe("ContactsView (Web)", () => {
  it("should always render the section title", () => {
    renderWithStyle(<ContactsView title="Pay contact" isEmpty emptyState={emptyState} />);

    expect(screen.getByTestId("pay-contacts")).toBeVisible();
    expect(screen.getByText("Pay contact")).toBeVisible();
  });

  it("should render the empty state when isEmpty is true", () => {
    renderWithStyle(<ContactsView title="Pay contact" isEmpty emptyState={emptyState} />);

    expect(screen.getByTestId("pay-contacts-empty-state")).toBeVisible();
    expect(screen.queryByTestId("contacts-table")).not.toBeInTheDocument();
  });

  it("should not render the empty state when isEmpty is false", () => {
    renderWithStyle(<ContactsView title="Pay contact" isEmpty={false} emptyState={emptyState} />);

    expect(screen.queryByTestId("pay-contacts-empty-state")).not.toBeInTheDocument();
  });
});
