import React from "react";
import { render, screen } from "@tests/test-renderer";
import { UnexpectedErrorContent } from ".";

describe("UnexpectedErrorContent", () => {
  it("shows the error", () => {
    render(<UnexpectedErrorContent onCancel={jest.fn()} />);

    expect(screen.getByTestId("os-update-unexpected-error")).toBeVisible();
    expect(screen.getByText("Something went wrong")).toBeVisible();
  });

  it("only offers cancel", async () => {
    const onCancel = jest.fn();
    const { user } = render(<UnexpectedErrorContent onCancel={onCancel} />);

    expect(screen.queryByText("Retry")).toBeNull();
    await user.press(screen.getByText("Cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
