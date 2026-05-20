import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceOutOfStorageSpaceView } from "./DeviceOutOfStorageSpaceView";

function renderView() {
  const onOpenMyLedger = jest.fn();

  return {
    ...render(<DeviceOutOfStorageSpaceView onOpenMyLedger={onOpenMyLedger} />),
    onOpenMyLedger,
  };
}

describe("DeviceOutOfStorageSpaceView", () => {
  it("should render the out of storage copy and primary cta", () => {
    renderView();

    expect(screen.getByText("Not enough device memory")).toBeVisible();
    expect(
      screen.getByText(
        "Your device doesn’t have enough memory. Please uninstall apps and try again.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Go to My Ledger")).toBeVisible();
  });

  it("should call onOpenMyLedger when the primary action is pressed", async () => {
    const { user, onOpenMyLedger } = renderView();

    await user.press(screen.getByText("Go to My Ledger"));

    expect(onOpenMyLedger).toHaveBeenCalledTimes(1);
  });
});
