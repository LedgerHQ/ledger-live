import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { ContinueOnDevice } from "./ContinueOnDevice";

describe("ContinueOnDevice", () => {
  it("should render the continue title interpolated with the product name and the description", () => {
    render(<ContinueOnDevice deviceModelId={DeviceModelId.europa} deviceName="Lily's Ledger" />);

    expect(screen.getByText("Continue on your Ledger Flex")).toBeVisible();
    expect(
      screen.getByText(/Follow the instructions displayed on your Secure.Screen/),
    ).toBeVisible();
  });

  it("should render the provided device name as a tag", () => {
    render(<ContinueOnDevice deviceModelId={DeviceModelId.europa} deviceName="Lily's Ledger" />);

    expect(screen.getByText("Lily's Ledger")).toBeVisible();
  });
});
