import React from "react";
import { render, screen } from "tests/testSetup";
import { EditAddressDialog } from "../components/EditAddressDialog";

// Stub the device runner so the tests don't try to spin up the real
// DMK connect flow. Same pattern as RenameAddressDialog's test.
jest.mock(
  "~/mvvm/features/Contacts/components/RunDeviceAction",
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="contacts-management-edit-address-device-stub" />
    ),
  }),
);

const VALID_HEX = "0x" + "a".repeat(40);
const ANOTHER_VALID_HEX = "0x" + "b".repeat(40);

const baseProps = (
  overrides: Partial<React.ComponentProps<typeof EditAddressDialog>> = {},
) => ({
  open: true,
  onOpenChange: jest.fn(),
  currentAddressHex: VALID_HEX,
  onDeviceEdit: jest.fn(() => jest.fn().mockResolvedValue(undefined)),
  ...overrides,
});

describe("EditAddressDialog", () => {
  it("pre-fills the input with the current address", () => {
    render(<EditAddressDialog {...baseProps()} />);

    const input = screen.getByTestId(
      "contacts-management-edit-address-input",
    ) as HTMLInputElement;
    expect(input.value).toBe(VALID_HEX);
  });

  it("disables submit on initial open (value still equals the current address — Figma 14187:12344)", () => {
    render(<EditAddressDialog {...baseProps()} />);
    expect(
      screen.getByTestId("contacts-management-edit-address-submit"),
    ).toBeDisabled();
  });

  it("keeps submit disabled while the new value is partial / invalid hex", async () => {
    const { user } = render(<EditAddressDialog {...baseProps()} />);

    const input = screen.getByTestId("contacts-management-edit-address-input");
    await user.clear(input);
    await user.type(input, "0xnot-a-valid-hex");

    expect(
      screen.getByTestId("contacts-management-edit-address-submit"),
    ).toBeDisabled();
  });

  it("enables submit once the user enters a valid, different address (Figma 14074:12293)", async () => {
    const { user } = render(<EditAddressDialog {...baseProps()} />);

    const input = screen.getByTestId("contacts-management-edit-address-input");
    await user.clear(input);
    await user.type(input, ANOTHER_VALID_HEX);

    expect(
      screen.getByTestId("contacts-management-edit-address-submit"),
    ).toBeEnabled();
  });

  it("switches to the device step on submit, asking the host for the verb with the trimmed value", async () => {
    const verb = jest.fn().mockResolvedValue(undefined);
    const onDeviceEdit = jest.fn(() => verb);
    const { user } = render(<EditAddressDialog {...baseProps({ onDeviceEdit })} />);

    const input = screen.getByTestId("contacts-management-edit-address-input");
    await user.clear(input);
    await user.type(input, `  ${ANOTHER_VALID_HEX}  `);
    await user.click(
      screen.getByTestId("contacts-management-edit-address-submit"),
    );

    expect(onDeviceEdit).toHaveBeenCalledWith(ANOTHER_VALID_HEX);
    expect(
      screen.getByTestId("contacts-management-edit-address-device-stub"),
    ).toBeInTheDocument();
    // The input is unmounted while the runner owns the body.
    expect(
      screen.queryByTestId("contacts-management-edit-address-input"),
    ).not.toBeInTheDocument();
  });

  it("hides the back arrow when `onBack` is not provided (opened from the row menu)", () => {
    render(<EditAddressDialog {...baseProps()} />);
    expect(
      screen.queryByRole("button", {
        name: "components.dialogHeader.goBackAriaLabel",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders a back arrow when `onBack` is provided, and calls it on click", async () => {
    const onBack = jest.fn();
    const { user } = render(<EditAddressDialog {...baseProps({ onBack })} />);

    const back = screen.getByRole("button", {
      name: "components.dialogHeader.goBackAriaLabel",
    });
    expect(back).toBeInTheDocument();
    await user.click(back);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("re-primes the input + returns to the address step when reopened with a new entry", () => {
    const { rerender } = render(<EditAddressDialog {...baseProps()} />);
    expect(
      (
        screen.getByTestId(
          "contacts-management-edit-address-input",
        ) as HTMLInputElement
      ).value,
    ).toBe(VALID_HEX);

    rerender(<EditAddressDialog {...baseProps({ open: false })} />);
    rerender(
      <EditAddressDialog
        {...baseProps({ open: true, currentAddressHex: ANOTHER_VALID_HEX })}
      />,
    );

    expect(
      (
        screen.getByTestId(
          "contacts-management-edit-address-input",
        ) as HTMLInputElement
      ).value,
    ).toBe(ANOTHER_VALID_HEX);
  });
});
