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
});
