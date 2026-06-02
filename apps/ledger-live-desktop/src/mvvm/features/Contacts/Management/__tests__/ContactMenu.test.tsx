import React from "react";
import { render, screen } from "tests/testSetup";
import { ContactMenu } from "../components/ContactMenu";

describe("ContactMenu", () => {
  it("renders the trigger and keeps the menu closed by default", () => {
    render(<ContactMenu />);
    expect(screen.getByTestId("contacts-management-overflow")).toBeInTheDocument();
    expect(
      screen.queryByTestId("contacts-management-contact-menu-edit"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("contacts-management-contact-menu-delete"),
    ).not.toBeInTheDocument();
  });

  it("opens the popover with Edit + Delete items when the trigger is clicked", async () => {
    const { user } = render(<ContactMenu />);

    await user.click(screen.getByTestId("contacts-management-overflow"));

    expect(screen.getByTestId("contacts-management-contact-menu-edit")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-contact-menu-delete")).toBeInTheDocument();
    expect(screen.getByText("Edit contact")).toBeInTheDocument();
    expect(screen.getByText("Delete contact")).toBeInTheDocument();
  });

  it("fires the onEdit callback when the Edit item is clicked", async () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const { user } = render(<ContactMenu onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByTestId("contacts-management-overflow"));
    await user.click(screen.getByTestId("contacts-management-contact-menu-edit"));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("fires the onDelete callback when the Delete item is clicked", async () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const { user } = render(<ContactMenu onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByTestId("contacts-management-overflow"));
    await user.click(screen.getByTestId("contacts-management-contact-menu-delete"));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("dismisses itself when an item is clicked (so it sits behind any dialog the handler opens)", async () => {
    // Repro of the previous bug: handlers that open a Dialog used to
    // leave the popover stuck on top of the overlay because the
    // Popover was uncontrolled. We now close `open` synchronously
    // before calling the handler — assert the items unmount.
    const onEdit = jest.fn();
    const { user } = render(<ContactMenu onEdit={onEdit} />);

    await user.click(screen.getByTestId("contacts-management-overflow"));
    await user.click(screen.getByTestId("contacts-management-contact-menu-edit"));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByTestId("contacts-management-contact-menu-edit"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("contacts-management-contact-menu-delete"),
    ).not.toBeInTheDocument();
  });

  it("hides the Delete row when `canDelete` is false (protected 'me' contact)", async () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const { user } = render(
      <ContactMenu onEdit={onEdit} onDelete={onDelete} canDelete={false} />,
    );

    await user.click(screen.getByTestId("contacts-management-overflow"));

    expect(
      screen.getByTestId("contacts-management-contact-menu-edit"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("contacts-management-contact-menu-delete"),
    ).not.toBeInTheDocument();
  });
});
