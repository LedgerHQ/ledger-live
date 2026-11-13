import React from "react";
import { render, screen } from "../../../__tests__/render";
import { InstallFirmwareRefusedContent } from "./InstallFirmwareRefusedContent";

function renderContent({ onRetry = jest.fn(), onCancel = jest.fn() } = {}) {
  return render(
    <InstallFirmwareRefusedContent
      productName="Ledger Stax"
      onRetry={onRetry}
      onCancel={onCancel}
    />,
  );
}

describe("InstallFirmwareRefusedContent", () => {
  it("names the device the installation was cancelled on", () => {
    renderContent();

    expect(screen.getByTestId("os-update-install-firmware-refused")).toBeVisible();
    expect(screen.getByText("OS update installation cancelled on Ledger Stax")).toBeVisible();
    expect(screen.getByText("If this was a mistake, restart the update.")).toBeVisible();
  });

  it("restarts and cancels the update independently", async () => {
    const onRetry = jest.fn();
    const onCancel = jest.fn();
    const { user } = renderContent({ onRetry, onCancel });

    await user.press(screen.getByText("Restart OS update"));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();

    await user.press(screen.getByText("Cancel OS update"));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
