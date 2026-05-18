import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { UnlockDevice } from "./UnlockDevice";

describe("UnlockDevice", () => {
  it("should render the unlock title interpolated with the product name", () => {
    render(<UnlockDevice deviceModelId={DeviceModelId.europa} deviceName="Lily's Ledger" />);

    expect(screen.getByText("Unlock your Ledger Flex")).toBeVisible();
  });

  it("should render the provided device name as a tag", () => {
    render(<UnlockDevice deviceModelId={DeviceModelId.europa} deviceName="Lily's Ledger" />);

    expect(screen.getByText("Lily's Ledger")).toBeVisible();
  });
});
