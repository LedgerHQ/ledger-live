import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen } from "@tests/test-renderer";
import { SecureConnectionRefusedContent } from ".";

const renderContent = (onRetry = jest.fn(), onCancel = jest.fn()) =>
  render(
    <SecureConnectionRefusedContent
      deviceModelId={DeviceModelId.apex}
      onRetry={onRetry}
      onCancel={onCancel}
    />,
  );

describe("SecureConnectionRefusedContent", () => {
  it("explains that the secure connection is mandatory to update the device", () => {
    renderContent();

    expect(screen.getByTestId("os-update-secure-connection-refused")).toBeVisible();
    expect(screen.getByText("Cancel secure connection?")).toBeVisible();
    expect(
      screen.getByText(
        "Secure connection is mandatory to continue updating your Ledger Nano Gen5.",
      ),
    ).toBeVisible();
  });

  it("retries and cancels the secure connection independently", async () => {
    const onRetry = jest.fn();
    const onCancel = jest.fn();
    const { user } = renderContent(onRetry, onCancel);

    await user.press(screen.getByText("Retry secure connection"));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();

    await user.press(screen.getByText("Cancel secure connection"));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
