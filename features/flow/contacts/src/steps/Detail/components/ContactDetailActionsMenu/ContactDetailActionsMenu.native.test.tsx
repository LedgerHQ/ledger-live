import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ContactDetailActionsMenu } from "./ContactDetailActionsMenu.native";

const labels = {
  editContact: "Edit name",
  deleteContact: "Delete contact",
};

const defaultProps = {
  isOpen: true,
  canDelete: true,
  labels,
  onEdit: jest.fn(),
  onDelete: jest.fn(),
};

describe("ContactDetailActionsMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render edit and delete actions when delete is allowed", () => {
    render(<ContactDetailActionsMenu {...defaultProps} />);

    expect(screen.getByTestId("contacts-detail-actions-menu")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-edit-action")).toHaveTextContent("Edit name");
    expect(screen.getByTestId("contacts-detail-delete-action")).toHaveTextContent("Delete contact");
  });

  it("should hide the delete action for Me contacts", () => {
    render(<ContactDetailActionsMenu {...defaultProps} canDelete={false} />);

    expect(screen.getByTestId("contacts-detail-edit-action")).toBeVisible();
    expect(screen.queryByTestId("contacts-detail-delete-action")).toBeNull();
  });

  it("should not render menu content when closed", () => {
    render(<ContactDetailActionsMenu {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId("contacts-detail-actions-menu")).toBeNull();
  });

  it("should call action handlers when menu items are pressed", () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(
      <ContactDetailActionsMenu {...defaultProps} onEdit={onEdit} onDelete={onDelete} />,
    );

    fireEvent.press(screen.getByTestId("contacts-detail-edit-action"));
    fireEvent.press(screen.getByTestId("contacts-detail-delete-action"));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
