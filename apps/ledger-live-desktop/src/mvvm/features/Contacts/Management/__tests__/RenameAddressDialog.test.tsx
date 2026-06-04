import React from "react";
import { render, screen } from "tests/testSetup";
import { RenameAddressDialog } from "../components/RenameAddressDialog";

// Stub the device runner — keeps the dialog tests off DMK plumbing.
// Same pattern as `EditContactDialog`'s test file.
jest.mock(
  "~/mvvm/features/Contacts/components/RunDeviceAction",
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="contacts-management-rename-address-device-stub" />
    ),
  }),
);

const baseProps = (
  overrides: Partial<React.ComponentProps<typeof RenameAddressDialog>> = {},
) => ({
  open: true,
  onOpenChange: jest.fn(),
  currentLabel: "Ethereum Main",
  onDeviceRename: jest.fn(() => jest.fn().mockResolvedValue(undefined)),
  ...overrides,
});

describe("RenameAddressDialog", () => {
  it("pre-fills the input with the current label", () => {
    render(<RenameAddressDialog {...baseProps()} />);

    const input = screen.getByTestId(
      "contacts-management-rename-address-input",
    ) as HTMLInputElement;
    expect(input.value).toBe("Ethereum Main");
  });

  it("disables submit on initial open (value still equals the current label)", () => {
    render(<RenameAddressDialog {...baseProps()} />);
    expect(
      screen.getByTestId("contacts-management-rename-address-submit"),
    ).toBeDisabled();
  });

  it("enables submit once the user edits the value", async () => {
    const { user } = render(<RenameAddressDialog {...baseProps()} />);

    const input = screen.getByTestId("contacts-management-rename-address-input");
    await user.clear(input);
    await user.type(input, "Ethereum principal");

    expect(
      screen.getByTestId("contacts-management-rename-address-submit"),
    ).toBeEnabled();
  });

  it("switches to the device step when the user submits a valid new label", async () => {
    const verb = jest.fn().mockResolvedValue(undefined);
    const onDeviceRename = jest.fn(() => verb);
    const { user } = render(
      <RenameAddressDialog {...baseProps({ onDeviceRename })} />,
    );

    const input = screen.getByTestId("contacts-management-rename-address-input");
    await user.clear(input);
    await user.type(input, "Ethereum principal");
    await user.click(
      screen.getByTestId("contacts-management-rename-address-submit"),
    );

    // The dialog must have asked the host for the verb (with the
    // trimmed new label) and mounted the runner.
    expect(onDeviceRename).toHaveBeenCalledWith("Ethereum principal");
    expect(
      screen.getByTestId("contacts-management-rename-address-device-stub"),
    ).toBeInTheDocument();
    // Name input is unmounted while the runner owns the body.
    expect(
      screen.queryByTestId("contacts-management-rename-address-input"),
    ).not.toBeInTheDocument();
  });

  it("hides the back arrow when `onBack` is not provided (opened from the row menu)", () => {
    render(<RenameAddressDialog {...baseProps()} />);
    // Lumen's `DialogHeader` renders the back affordance with
    // `aria-label="components.dialogHeader.goBackAriaLabel"`. No
    // `onBack` → no button.
    expect(
      screen.queryByRole("button", {
        name: "components.dialogHeader.goBackAriaLabel",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders a back arrow when `onBack` is provided, and calls it on click", async () => {
    const onBack = jest.fn();
    const { user } = render(<RenameAddressDialog {...baseProps({ onBack })} />);

    const back = screen.getByRole("button", {
      name: "components.dialogHeader.goBackAriaLabel",
    });
    expect(back).toBeInTheDocument();
    await user.click(back);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("re-primes the input + returns to the name step when reopened with a new label", () => {
    const { rerender } = render(<RenameAddressDialog {...baseProps()} />);
    expect(
      (
        screen.getByTestId("contacts-management-rename-address-input") as HTMLInputElement
      ).value,
    ).toBe("Ethereum Main");

    rerender(<RenameAddressDialog {...baseProps({ open: false })} />);
    rerender(
      <RenameAddressDialog {...baseProps({ open: true, currentLabel: "Cold storage" })} />,
    );

    expect(
      (
        screen.getByTestId("contacts-management-rename-address-input") as HTMLInputElement
      ).value,
    ).toBe("Cold storage");
  });
});
