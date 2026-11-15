import React from "react";
import { render, screen } from "@tests/test-renderer";
import { ConnectionTimedOutContent } from ".";

function renderContent({ onRestart = jest.fn(), onCancel = jest.fn() } = {}) {
  return render(<ConnectionTimedOutContent onRestart={onRestart} onCancel={onCancel} />);
}

describe("ConnectionTimedOutContent", () => {
  it("tells the connection timed out", () => {
    renderContent();

    expect(screen.getByTestId("os-update-connection-timed-out")).toBeVisible();
    expect(screen.getByText("Connection timed out")).toBeVisible();
    expect(screen.getByText("Restart the update.")).toBeVisible();
  });

  it("restarts and cancels the update independently", async () => {
    const onRestart = jest.fn();
    const onCancel = jest.fn();
    const { user } = renderContent({ onRestart, onCancel });

    await user.press(screen.getByText("Restart OS update"));

    expect(onRestart).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();

    await user.press(screen.getByText("Cancel OS update"));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onRestart).toHaveBeenCalledTimes(1);
  });
});
