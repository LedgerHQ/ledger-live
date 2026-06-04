import React from "react";
import { render, screen } from "tests/testSetup";
import { AddContactDialog } from "../components/AddContactDialog";

const baseProps = (overrides: Partial<React.ComponentProps<typeof AddContactDialog>> = {}) => ({
  open: true,
  onOpenChange: jest.fn(),
  onSubmit: jest.fn(),
  takenNames: ["Alice", "Bob"],
  ...overrides,
});

describe("AddContactDialog", () => {
  it("renders nothing when `open` is false", () => {
    render(<AddContactDialog {...baseProps({ open: false })} />);
    expect(screen.queryByTestId("contacts-management-add-contact-dialog")).not.toBeInTheDocument();
  });

  it("renders the privacy guidance banner above the submit button (Figma 14201:12756)", () => {
    render(<AddContactDialog {...baseProps()} />);

    const banner = screen.getByTestId(
      "contacts-management-add-contact-privacy-banner",
    );
    expect(banner).toBeInTheDocument();
    // The banner copy is wired to the i18n key
    // `contactsManagement.addContactDialog.privacyBanner` — assert the
    // visible text rather than the raw key so a future copy edit
    // doesn't silently strip the surfaced guidance.
    expect(banner).toHaveTextContent(/For your privacy, avoid full names/i);
    expect(banner).toHaveTextContent(/John S\./);

    // Layout contract: the banner sits between the input/counter group
    // and the submit button. `compareDocumentPosition` returns the
    // bitmask `Node.DOCUMENT_POSITION_FOLLOWING` (4) when the second
    // argument follows the first — so the banner must follow the
    // input AND precede the submit.
    const input = screen.getByTestId("contacts-management-add-contact-name");
    const submit = screen.getByTestId(
      "contacts-management-add-contact-submit",
    );
    /* eslint-disable no-bitwise */
    expect(
      input.compareDocumentPosition(banner) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      banner.compareDocumentPosition(submit) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    /* eslint-enable no-bitwise */
  });

  it("renders an empty name input and a disabled submit on first open", () => {
    render(<AddContactDialog {...baseProps()} />);

    const input = screen.getByTestId("contacts-management-add-contact-name") as HTMLInputElement;
    const submit = screen.getByTestId(
      "contacts-management-add-contact-submit",
    ) as HTMLButtonElement;

    expect(input.value).toBe("");
    expect(submit).toBeDisabled();
  });

  it("enables the submit button once a valid name is typed", async () => {
    const { user } = render(<AddContactDialog {...baseProps()} />);

    const input = screen.getByTestId("contacts-management-add-contact-name");
    await user.type(input, "Charlie");

    expect(screen.getByTestId("contacts-management-add-contact-submit")).toBeEnabled();
  });

  it("keeps submit disabled when the name matches an existing contact (case-insensitive)", async () => {
    const { user } = render(<AddContactDialog {...baseProps()} />);

    const input = screen.getByTestId("contacts-management-add-contact-name");
    await user.type(input, "alice");

    expect(screen.getByTestId("contacts-management-add-contact-submit")).toBeDisabled();
  });

  it("calls onSubmit with the trimmed name when submit is clicked", async () => {
    const onSubmit = jest.fn();
    const { user } = render(<AddContactDialog {...baseProps({ onSubmit })} />);

    await user.type(screen.getByTestId("contacts-management-add-contact-name"), "  Charlie  ");
    await user.click(screen.getByTestId("contacts-management-add-contact-submit"));

    expect(onSubmit).toHaveBeenCalledWith("Charlie");
  });

  it("submits on Enter inside the input", async () => {
    const onSubmit = jest.fn();
    const { user } = render(<AddContactDialog {...baseProps({ onSubmit })} />);

    const input = screen.getByTestId("contacts-management-add-contact-name");
    await user.type(input, "Charlie{Enter}");

    expect(onSubmit).toHaveBeenCalledWith("Charlie");
  });

  it("blocks names ending with ' (Me)' — the suffix is reserved for the Me identity", async () => {
    const onSubmit = jest.fn();
    const { user } = render(<AddContactDialog {...baseProps({ onSubmit })} />);

    const input = screen.getByTestId("contacts-management-add-contact-name") as HTMLInputElement;
    await user.type(input, "Brian (Me)");

    // The aria-invalid flag is the contract here — the Lumen
    // `errorMessage` prop is wired up but the pinned Lumen version
    // doesn't actually render it (pre-existing type/render gap we
    // hit elsewhere). Submit-disabled + aria-invalid is what guards
    // the user.
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByTestId("contacts-management-add-contact-submit")).toBeDisabled();

    // Enter must also be inert — the keyboard path shouldn't bypass the
    // disabled-button check.
    await user.type(input, "{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does NOT fire onSubmit on Enter when the name is invalid", async () => {
    const onSubmit = jest.fn();
    const { user } = render(<AddContactDialog {...baseProps({ onSubmit })} />);

    const input = screen.getByTestId("contacts-management-add-contact-name");
    // duplicate (collides with the "Bob" name in takenNames)
    await user.type(input, "Bob{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("resets the input when the dialog is re-opened", async () => {
    const { rerender, user } = render(<AddContactDialog {...baseProps()} />);

    await user.type(screen.getByTestId("contacts-management-add-contact-name"), "Charlie");
    expect(
      (screen.getByTestId("contacts-management-add-contact-name") as HTMLInputElement).value,
    ).toBe("Charlie");

    rerender(<AddContactDialog {...baseProps({ open: false })} />);
    rerender(<AddContactDialog {...baseProps({ open: true })} />);

    expect(
      (screen.getByTestId("contacts-management-add-contact-name") as HTMLInputElement).value,
    ).toBe("");
  });
});
