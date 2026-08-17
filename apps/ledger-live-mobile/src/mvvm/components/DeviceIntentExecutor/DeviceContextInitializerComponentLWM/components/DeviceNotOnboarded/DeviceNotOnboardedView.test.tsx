import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceNotOnboardedView } from "./DeviceNotOnboardedView";

function renderView() {
  const onSetupDevice = jest.fn();

  return {
    ...render(<DeviceNotOnboardedView productName="Flex" onSetupDevice={onSetupDevice} />),
    onSetupDevice,
  };
}

describe("DeviceNotOnboardedView", () => {
  it("should render the not-onboarded copy with the product name", () => {
    renderView();

    expect(screen.getByText("Your Ledger device needs to be set up")).toBeVisible();
    expect(screen.getByText("Set it up to continue.")).toBeVisible();
    expect(screen.getByText("Setup Ledger device")).toBeVisible();
  });

  it("should call onSetupDevice when the primary action is pressed", async () => {
    const { user, onSetupDevice } = renderView();

    await user.press(screen.getByText("Setup Ledger device"));

    expect(onSetupDevice).toHaveBeenCalledTimes(1);
  });
});
