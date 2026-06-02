import React from "react";
import { render, screen } from "tests/testSetup";
import { DeleteContactDialog } from "../components/DeleteContactDialog";

const baseProps = (
  overrides: Partial<React.ComponentProps<typeof DeleteContactDialog>> = {},
) => ({
  open: true,
  onOpenChange: jest.fn(),
  onConfirm: jest.fn(),
  ...overrides,
});

describe("DeleteContactDialog", () => {
  it("renders nothing when closed", () => {
    render(<DeleteContactDialog {...baseProps({ open: false })} />);

    expect(
      screen.queryByTestId("contacts-management-delete-contact-dialog"),
    ).not.toBeInTheDocument();
  });

  it("renders the title, body, and the Cancel + Delete buttons when open", () => {
    render(<DeleteContactDialog {...baseProps()} />);

    expect(
      screen.getByTestId("contacts-management-delete-contact-dialog"),
    ).toBeInTheDocument();
    expect(screen.getByText("Delete contact?")).toBeInTheDocument();
    expect(
      screen.getByText("Removing this contact will erase all associated addresses."),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("contacts-management-delete-contact-cancel"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("contacts-management-delete-contact-confirm"),
    ).toBeInTheDocument();
  });

  it("only closes — does NOT call onConfirm — when Cancel is clicked", async () => {
    const onOpenChange = jest.fn();
    const onConfirm = jest.fn();
    const { user } = render(
      <DeleteContactDialog {...baseProps({ onOpenChange, onConfirm })} />,
    );

    await user.click(
      screen.getByTestId("contacts-management-delete-contact-cancel"),
    );

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("closes AND fires onConfirm when Delete is clicked", async () => {
    const onOpenChange = jest.fn();
    const onConfirm = jest.fn();
    const { user } = render(
      <DeleteContactDialog {...baseProps({ onOpenChange, onConfirm })} />,
    );

    await user.click(
      screen.getByTestId("contacts-management-delete-contact-confirm"),
    );

    // Close is dispatched first so the dialog's exit animation runs
    // in parallel with the parent's post-delete re-render — same
    // pattern as the other dialogs in this feature.
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
