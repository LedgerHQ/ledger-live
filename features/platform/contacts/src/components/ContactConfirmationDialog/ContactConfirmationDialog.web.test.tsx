import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ContactConfirmationDialog } from ".";

const labels = {
  title: "Delete contact?",
  description: "This contact and its addresses will be removed.",
  confirm: "Delete",
  cancel: "Cancel",
};

describe("ContactConfirmationDialog", () => {
  it("should render the labels while open", () => {
    render(
      <ContactConfirmationDialog
        isOpen
        tone="destructive"
        labels={labels}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        testID="contacts-delete-dialog"
      />,
    );

    expect(screen.getByTestId("contacts-delete-dialog")).toBeVisible();
    expect(screen.getByText("Delete contact?")).toBeVisible();
    expect(screen.getByText("This contact and its addresses will be removed.")).toBeVisible();
  });

  it("should render no content while closed", () => {
    render(
      <ContactConfirmationDialog
        isOpen={false}
        tone="neutral"
        labels={labels}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        testID="contacts-delete-dialog"
      />,
    );

    expect(screen.queryByTestId("contacts-delete-dialog")).not.toBeInTheDocument();
  });

  it("should call onConfirm and onCancel from their buttons", () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <ContactConfirmationDialog
        isOpen
        tone="neutral"
        labels={labels}
        onConfirm={onConfirm}
        onCancel={onCancel}
        confirmTestID="contacts-dialog-confirm"
        cancelTestID="contacts-dialog-cancel"
      />,
    );

    fireEvent.click(screen.getByTestId("contacts-dialog-confirm"));
    fireEvent.click(screen.getByTestId("contacts-dialog-cancel"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should disable both buttons while confirming", () => {
    render(
      <ContactConfirmationDialog
        isOpen
        tone="destructive"
        labels={labels}
        isConfirming
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        confirmTestID="contacts-dialog-confirm"
        cancelTestID="contacts-dialog-cancel"
      />,
    );

    expect(screen.getByTestId("contacts-dialog-confirm")).toBeDisabled();
    expect(screen.getByTestId("contacts-dialog-cancel")).toBeDisabled();
  });
});
