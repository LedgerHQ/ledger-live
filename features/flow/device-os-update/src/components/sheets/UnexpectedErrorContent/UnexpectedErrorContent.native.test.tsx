import React from "react";
import { render, screen } from "../../../__tests__/render";
import { UnexpectedErrorContent } from "./UnexpectedErrorContent";

describe("UnexpectedErrorContent", () => {
  it("shows the error", () => {
    render(<UnexpectedErrorContent onCancel={jest.fn()} />);

    expect(screen.getByTestId("os-update-unexpected-error")).toBeVisible();
    expect(screen.getByText("Something went wrong")).toBeVisible();
  });

  it("only offers to cancel the OS update", async () => {
    const onCancel = jest.fn();
    const { user } = render(<UnexpectedErrorContent onCancel={onCancel} />);

    expect(screen.queryByText("Retry")).toBeNull();
    await user.press(screen.getByText("Cancel OS update"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("opens Ledger support from the description", async () => {
    const { user, ports } = render(<UnexpectedErrorContent onCancel={jest.fn()} />);

    await user.press(screen.getByTestId("os-update-unexpected-error-support-link"));

    expect(ports.openSupport).toHaveBeenCalledTimes(1);
  });
});
