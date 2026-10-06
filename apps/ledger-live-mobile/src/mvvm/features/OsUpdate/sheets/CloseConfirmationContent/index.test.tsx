import React from "react";
import { render, screen } from "@tests/test-renderer";
import { CloseConfirmationContent } from ".";

describe("CloseConfirmationContent", () => {
  it("warns that leaving now may leave the settings and apps unrestored", () => {
    render(<CloseConfirmationContent onContinue={jest.fn()} onCancel={jest.fn()} />);

    expect(screen.getByTestId("os-update-close-confirmation")).toBeVisible();
    expect(screen.getByText("OS update is in progress")).toBeVisible();
    expect(
      screen.getByText(
        "Your settings and apps may not be restored properly if you cancel the update now.",
      ),
    ).toBeVisible();
  });

  it("continues the update from the primary action only", async () => {
    const onContinue = jest.fn();
    const onCancel = jest.fn();
    const { user } = render(
      <CloseConfirmationContent onContinue={onContinue} onCancel={onCancel} />,
    );

    await user.press(screen.getByText("Continue OS update"));

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("cancels the update from the secondary action only", async () => {
    const onContinue = jest.fn();
    const onCancel = jest.fn();
    const { user } = render(
      <CloseConfirmationContent onContinue={onContinue} onCancel={onCancel} />,
    );

    await user.press(screen.getByText("Cancel OS update"));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onContinue).not.toHaveBeenCalled();
  });
});
