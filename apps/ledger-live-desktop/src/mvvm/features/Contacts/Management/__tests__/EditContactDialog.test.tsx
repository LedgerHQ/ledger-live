import React from "react";
import { render, screen } from "tests/testSetup";
import { EditContactDialog } from "../components/EditContactDialog";

const baseProps = (overrides: Partial<React.ComponentProps<typeof EditContactDialog>> = {}) => ({
  open: true,
  onOpenChange: jest.fn(),
  currentName: "Alice",
  onSubmit: jest.fn(),
  takenNames: ["Bob", "Charlie"], // exclude current name
  ...overrides,
});

describe("EditContactDialog", () => {
  it("pre-fills the input with the current name", () => {
    render(<EditContactDialog {...baseProps()} />);

    const input = screen.getByTestId(
      "contacts-management-edit-contact-name",
    ) as HTMLInputElement;
    expect(input.value).toBe("Alice");
  });

  it("disables submit when the name is unchanged (no-op rename)", () => {
    render(<EditContactDialog {...baseProps()} />);

    expect(screen.getByTestId("contacts-management-edit-contact-submit")).toBeDisabled();
  });

  it("enables submit once the name is meaningfully edited", async () => {
    const { user } = render(<EditContactDialog {...baseProps()} />);

    const input = screen.getByTestId("contacts-management-edit-contact-name");
    await user.clear(input);
    await user.type(input, "Alicia");

    expect(screen.getByTestId("contacts-management-edit-contact-submit")).toBeEnabled();
  });

  it("blocks submit when the new name collides with another contact (case-insensitive)", async () => {
    const { user } = render(<EditContactDialog {...baseProps()} />);

    const input = screen.getByTestId("contacts-management-edit-contact-name");
    await user.clear(input);
    await user.type(input, "bob");

    expect(screen.getByTestId("contacts-management-edit-contact-submit")).toBeDisabled();
  });

  it("calls onSubmit with the trimmed new name", async () => {
    const onSubmit = jest.fn();
    const { user } = render(<EditContactDialog {...baseProps({ onSubmit })} />);

    const input = screen.getByTestId("contacts-management-edit-contact-name");
    await user.clear(input);
    await user.type(input, "  Alicia  ");
    await user.click(screen.getByTestId("contacts-management-edit-contact-submit"));

    expect(onSubmit).toHaveBeenCalledWith("Alicia");
  });

  it("re-primes the input when reopened with a different currentName", () => {
    const { rerender } = render(<EditContactDialog {...baseProps()} />);
    expect(
      (screen.getByTestId("contacts-management-edit-contact-name") as HTMLInputElement).value,
    ).toBe("Alice");

    rerender(<EditContactDialog {...baseProps({ open: false })} />);
    rerender(<EditContactDialog {...baseProps({ open: true, currentName: "Diana" })} />);

    expect(
      (screen.getByTestId("contacts-management-edit-contact-name") as HTMLInputElement).value,
    ).toBe("Diana");
  });
});
