import React from "react";
import { render, screen } from "tests/testSetup";
import { SeedMismatchInfoDialog } from "../components/SeedMismatchInfoDialog";

const dialog = () => screen.queryByTestId("contacts-management-seed-mismatch-dialog");
const dismiss = () => screen.getByTestId("contacts-management-seed-mismatch-dismiss");

describe("SeedMismatchInfoDialog", () => {
  it("renders the body + a single dismiss button when open", () => {
    render(<SeedMismatchInfoDialog open onOpenChange={jest.fn()} />);

    expect(dialog()).toBeInTheDocument();
    expect(dismiss()).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    render(<SeedMismatchInfoDialog open={false} onOpenChange={jest.fn()} />);

    expect(dialog()).not.toBeInTheDocument();
  });

  it("calls onOpenChange(false) when dismissed", async () => {
    const onOpenChange = jest.fn();
    const { user } = render(<SeedMismatchInfoDialog open onOpenChange={onOpenChange} />);

    await user.click(dismiss());

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('defaults to the "contact" wording', () => {
    render(<SeedMismatchInfoDialog open onOpenChange={jest.fn()} />);

    expect(screen.getByText(/this contact belongs to another signer/i)).toBeInTheDocument();
  });

  it('uses the "account" wording for the account variant', () => {
    render(<SeedMismatchInfoDialog open variant="account" onOpenChange={jest.fn()} />);

    expect(screen.getByText(/this account belongs to another signer/i)).toBeInTheDocument();
  });
});
