import React from "react";
import { render, screen } from "@tests/test-renderer";
import { InstallFirmwareRefusedContent } from ".";

describe("InstallFirmwareRefusedContent", () => {
  it("shows the error", () => {
    render(<InstallFirmwareRefusedContent onCancel={jest.fn()} />);

    expect(screen.getByTestId("os-update-install-firmware-refused")).toBeVisible();
    expect(screen.getByText("Installation refused")).toBeVisible();
  });

  it("only offers cancel", async () => {
    const onCancel = jest.fn();
    const { user } = render(<InstallFirmwareRefusedContent onCancel={onCancel} />);

    expect(screen.queryByText("Retry")).toBeNull();
    await user.press(screen.getByText("Cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
