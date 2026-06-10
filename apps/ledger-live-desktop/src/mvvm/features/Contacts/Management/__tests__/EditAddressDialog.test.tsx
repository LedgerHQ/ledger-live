import React from "react";
import { render, screen } from "tests/testSetup";
import { EditAddressDialog } from "../components/EditAddressDialog";

// Stub the device runner so the tests don't spin up the real DMK connect
// flow. We only care that the merged dialog hands `onSubmit` the right
// (newAddressHex, newScope) and transitions to the device step.
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
const CURRENT_NAME = "Ethereum";

const baseProps = (
  overrides: Partial<React.ComponentProps<typeof EditAddressDialog>> = {},
) => ({
  open: true,
  onOpenChange: jest.fn(),
  currentAddressHex: VALID_HEX,
  currentLabel: CURRENT_NAME,
  onSubmit: jest.fn(() => jest.fn().mockResolvedValue(undefined)),
  ...overrides,
});

const addressInput = () =>
  screen.getByTestId("contacts-management-edit-address-input") as HTMLInputElement;
const nameInput = () =>
  screen.getByTestId("contacts-management-edit-address-name") as HTMLInputElement;
const submitBtn = () =>
  screen.getByTestId("contacts-management-edit-address-submit") as HTMLButtonElement;

describe("EditAddressDialog (merged Edit + Rename)", () => {
  it("pre-fills BOTH inputs with the current address and name", () => {
    render(<EditAddressDialog {...baseProps()} />);

    expect(addressInput().value).toBe(VALID_HEX);
    expect(nameInput().value).toBe(CURRENT_NAME);
  });

  it("disables 'Apply changes' on initial open (nothing changed yet)", () => {
    render(<EditAddressDialog {...baseProps()} />);
    expect(submitBtn()).toBeDisabled();
  });

  it("keeps submit disabled while the new address is invalid hex", async () => {
    const { user } = render(<EditAddressDialog {...baseProps()} />);

    await user.clear(addressInput());
    await user.type(addressInput(), "0xnot-a-valid-hex");

    expect(submitBtn()).toBeDisabled();
  });

  it("keeps submit disabled when the name is cleared (empty name is invalid)", async () => {
    const { user } = render(<EditAddressDialog {...baseProps()} />);

    await user.clear(nameInput());

    expect(submitBtn()).toBeDisabled();
  });

  it("submits an ADDRESS-ONLY change with the new address + unchanged name", async () => {
    const verb = jest.fn().mockResolvedValue(undefined);
    const onSubmit = jest.fn(() => verb);
    const { user } = render(<EditAddressDialog {...baseProps({ onSubmit })} />);

    await user.clear(addressInput());
    await user.type(addressInput(), `  ${ANOTHER_VALID_HEX}  `);
    expect(submitBtn()).toBeEnabled();
    await user.click(submitBtn());

    // Trimmed new address, current (unchanged) name.
    expect(onSubmit).toHaveBeenCalledWith(ANOTHER_VALID_HEX, CURRENT_NAME);
    expect(
      screen.getByTestId("contacts-management-edit-address-device-stub"),
    ).toBeInTheDocument();
  });

  it("submits a NAME-ONLY change with the unchanged address + new name", async () => {
    const onSubmit = jest.fn(() => jest.fn().mockResolvedValue(undefined));
    const { user } = render(<EditAddressDialog {...baseProps({ onSubmit })} />);

    await user.clear(nameInput());
    await user.type(nameInput(), "Cold storage");
    expect(submitBtn()).toBeEnabled();
    await user.click(submitBtn());

    expect(onSubmit).toHaveBeenCalledWith(VALID_HEX, "Cold storage");
  });

  it("submits a BOTH-CHANGED edit with the new address AND new name", async () => {
    const onSubmit = jest.fn(() => jest.fn().mockResolvedValue(undefined));
    const { user } = render(<EditAddressDialog {...baseProps({ onSubmit })} />);

    await user.clear(addressInput());
    await user.type(addressInput(), ANOTHER_VALID_HEX);
    await user.clear(nameInput());
    await user.type(nameInput(), "USDC bag");
    expect(submitBtn()).toBeEnabled();
    await user.click(submitBtn());

    expect(onSubmit).toHaveBeenCalledWith(ANOTHER_VALID_HEX, "USDC bag");
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

  it("re-primes both inputs + returns to the form step when reopened with a new entry", () => {
    const { rerender } = render(<EditAddressDialog {...baseProps()} />);
    expect(addressInput().value).toBe(VALID_HEX);
    expect(nameInput().value).toBe(CURRENT_NAME);

    rerender(<EditAddressDialog {...baseProps({ open: false })} />);
    rerender(
      <EditAddressDialog
        {...baseProps({
          open: true,
          currentAddressHex: ANOTHER_VALID_HEX,
          currentLabel: "Savings",
        })}
      />,
    );

    expect(addressInput().value).toBe(ANOTHER_VALID_HEX);
    expect(nameInput().value).toBe("Savings");
  });
});
