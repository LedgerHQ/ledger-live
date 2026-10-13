import React from "react";
import { render, screen } from "@tests/test-renderer";
import { UpdatesAppliedScreen } from ".";

describe("UpdatesAppliedScreen", () => {
  it("shows the update summary for an OS update", () => {
    render(
      <UpdatesAppliedScreen productName="Ledger Stax" isRestoreOnly={false} onClose={jest.fn()} />,
    );

    expect(screen.getByText("Update complete")).toBeVisible();
    expect(screen.getByText("Your Ledger Stax is up to date.")).toBeVisible();
  });

  it("shows the restore summary for a standalone restore", () => {
    render(<UpdatesAppliedScreen productName="Ledger Stax" isRestoreOnly onClose={jest.fn()} />);

    expect(screen.getByText("Backup restored")).toBeVisible();
  });

  it("closes on press", async () => {
    const onClose = jest.fn();
    const { user } = render(
      <UpdatesAppliedScreen productName="Ledger Stax" isRestoreOnly={false} onClose={onClose} />,
    );

    await user.press(screen.getByText("Close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
