import React from "react";
import { render, screen } from "@tests/test-renderer";
import { ConnectionTimedOutContent } from ".";

function renderContent({ onRestart = jest.fn(), onSendReport = jest.fn() } = {}) {
  return render(<ConnectionTimedOutContent onRestart={onRestart} onSendReport={onSendReport} />);
}

describe("ConnectionTimedOutContent", () => {
  it("tells the connection timed out", () => {
    renderContent();

    expect(screen.getByTestId("os-update-connection-timed-out")).toBeVisible();
    expect(screen.getByText("Connection timed out")).toBeVisible();
    expect(screen.getByText("Restart the update.")).toBeVisible();
  });

  it("restarts the update and sends a report independently", async () => {
    const onRestart = jest.fn();
    const onSendReport = jest.fn();
    const { user } = renderContent({ onRestart, onSendReport });

    await user.press(screen.getByText("Restart OS update"));

    expect(onRestart).toHaveBeenCalledTimes(1);
    expect(onSendReport).not.toHaveBeenCalled();

    await user.press(screen.getByText("Send report to Ledger"));

    expect(onSendReport).toHaveBeenCalledTimes(1);
    expect(onRestart).toHaveBeenCalledTimes(1);
  });
});
