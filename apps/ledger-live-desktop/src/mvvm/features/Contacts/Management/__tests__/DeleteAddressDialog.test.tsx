import React from "react";
import { render, screen } from "tests/testSetup";
import { DeleteAddressDialog } from "../components/DeleteAddressDialog";

const baseProps = (
  overrides: Partial<React.ComponentProps<typeof DeleteAddressDialog>> = {},
) => ({
  open: true,
  onOpenChange: jest.fn(),
  onConfirm: jest.fn(),
  ...overrides,
});

describe("DeleteAddressDialog", () => {
  it("renders nothing when closed", () => {
    render(<DeleteAddressDialog {...baseProps({ open: false })} />);

    expect(
      screen.queryByTestId("contacts-management-delete-address-dialog"),
    ).not.toBeInTheDocument();
  });

  it("renders the Figma copy + the Cancel + Delete buttons when open", () => {
    render(<DeleteAddressDialog {...baseProps()} />);

    expect(
      screen.getByTestId("contacts-management-delete-address-dialog"),
    ).toBeInTheDocument();
    expect(screen.getByText("Delete address?")).toBeInTheDocument();
    expect(
      screen.getByText("This address will be removed from this contact."),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("contacts-management-delete-address-cancel"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("contacts-management-delete-address-confirm"),
    ).toBeInTheDocument();
  });

  it("only closes — does NOT call onConfirm — when Cancel is clicked", async () => {
    const onOpenChange = jest.fn();
    const onConfirm = jest.fn();
    const { user } = render(
      <DeleteAddressDialog {...baseProps({ onOpenChange, onConfirm })} />,
    );

    await user.click(
      screen.getByTestId("contacts-management-delete-address-cancel"),
    );

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("closes AND fires onConfirm when Delete is clicked", async () => {
    const onOpenChange = jest.fn();
    const onConfirm = jest.fn();
    const { user } = render(
      <DeleteAddressDialog {...baseProps({ onOpenChange, onConfirm })} />,
    );

    await user.click(
      screen.getByTestId("contacts-management-delete-address-confirm"),
    );

    // Close is dispatched first so the exit animation runs alongside
    // the parent's post-delete re-render — same pattern the other
    // dialogs in this feature use.
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
