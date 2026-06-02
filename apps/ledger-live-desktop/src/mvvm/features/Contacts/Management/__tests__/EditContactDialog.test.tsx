import React from "react";
import { render, screen } from "tests/testSetup";
import { EditContactDialog } from "../components/EditContactDialog";

// Stub the device runner — keeps the tests off DMK plumbing. The dialog
// only needs to know the runner mounted and (optionally) trigger
// `onDone` for the recovery path.
jest.mock(
  "~/mvvm/features/Contacts/components/RunDeviceAction",
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="contacts-management-edit-contact-device-stub" />
    ),
  }),
);

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

  it("calls onSubmit (local path) when requiresDeviceConfirm is false", async () => {
    const onSubmit = jest.fn();
    const onDeviceRename = jest.fn();
    const { user } = render(
      <EditContactDialog
        {...baseProps({
          onSubmit,
          requiresDeviceConfirm: false,
          onDeviceRename,
        })}
      />,
    );

    const input = screen.getByTestId("contacts-management-edit-contact-name");
    await user.clear(input);
    await user.type(input, "Alicia");
    await user.click(screen.getByTestId("contacts-management-edit-contact-submit"));

    expect(onSubmit).toHaveBeenCalledWith("Alicia");
    expect(onDeviceRename).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId("contacts-management-edit-contact-device-stub"),
    ).not.toBeInTheDocument();
  });

  it("switches to the device step when requiresDeviceConfirm is true", async () => {
    const onSubmit = jest.fn();
    const verb = jest.fn().mockResolvedValue(undefined);
    const onDeviceRename = jest.fn(() => verb);
    const { user } = render(
      <EditContactDialog
        {...baseProps({
          onSubmit,
          requiresDeviceConfirm: true,
          onDeviceRename,
        })}
      />,
    );

    const input = screen.getByTestId("contacts-management-edit-contact-name");
    await user.clear(input);
    await user.type(input, "Alicia");
    await user.click(screen.getByTestId("contacts-management-edit-contact-submit"));

    // The dialog must NOT take the local path — it hands the verb to
    // the runner instead.
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onDeviceRename).toHaveBeenCalledWith("Alicia");
    expect(
      screen.getByTestId("contacts-management-edit-contact-device-stub"),
    ).toBeInTheDocument();
    // Name input must be unmounted — the body has swapped to the runner.
    expect(
      screen.queryByTestId("contacts-management-edit-contact-name"),
    ).not.toBeInTheDocument();
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
