import React from "react";
import { Linking } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { UnexpectedErrorContent } from ".";

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
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { user } = render(<UnexpectedErrorContent onCancel={jest.fn()} />);

    await user.press(screen.getByTestId("os-update-unexpected-error-support-link"));

    expect(openURL).toHaveBeenCalledWith(expect.stringContaining("support.ledger.com"));
  });
});
