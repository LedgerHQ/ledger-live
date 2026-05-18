import React from "react";
import { render, screen } from "@tests/test-renderer";
import { InvalidOperation } from "./InvalidOperation";

describe("InvalidOperation", () => {
  it("renders title, description and the primary Close CTA", () => {
    render(<InvalidOperation onClose={jest.fn()} error={null} />);

    expect(screen.getByTestId("device-intent-executor-invalid-operation")).toBeVisible();
    expect(screen.getByText("Invalid state")).toBeVisible();
    expect(
      screen.getByText(
        "An error occurred. Please try again or contact Ledger support if the issue persists.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Close")).toBeVisible();
  });

  it("invokes onClose when the primary CTA is pressed", async () => {
    const onClose = jest.fn();

    const { user } = render(<InvalidOperation onClose={onClose} error={null} />);

    await user.press(screen.getByText("Close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
