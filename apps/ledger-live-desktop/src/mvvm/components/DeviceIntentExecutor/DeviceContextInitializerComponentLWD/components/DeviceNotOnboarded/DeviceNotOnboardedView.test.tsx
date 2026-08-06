import React from "react";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { DeviceNotOnboardedView } from "./DeviceNotOnboardedView";

describe("DeviceNotOnboardedView", () => {
  const renderView = () => {
    const onSetupDevice = jest.fn();
    const { user } = render(
      <DeviceNotOnboardedView productName="Ledger Nano X" onSetupDevice={onSetupDevice} />,
    );
    return { user, onSetupDevice };
  };

  it("GIVEN the device not onboarded view WHEN rendering THEN it shows the not ready copy", () => {
    // GIVEN
    renderView();

    // THEN
    expect(screen.getByText("Your Ledger is not ready to use yet")).toBeVisible();
  });

  it("GIVEN the device not onboarded view WHEN clicking Set up device THEN it calls the setup action", async () => {
    // GIVEN
    const { user, onSetupDevice } = renderView();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Set up device" }));

    // THEN
    expect(onSetupDevice).toHaveBeenCalledTimes(1);
  });
});
