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

    expect(screen.getByText("Your Ledger is not ready to use yet")).toBeVisible();
    expect(
      screen.getByText(
        "You need to set up your Flex first. We will guide you through the device setup process",
      ),
    ).toBeVisible();
    expect(screen.getByText("Set up device")).toBeVisible();
  });

  it("should call onSetupDevice when the primary action is pressed", async () => {
    const { user, onSetupDevice } = renderView();

    await user.press(screen.getByText("Set up device"));

    expect(onSetupDevice).toHaveBeenCalledTimes(1);
  });
});
