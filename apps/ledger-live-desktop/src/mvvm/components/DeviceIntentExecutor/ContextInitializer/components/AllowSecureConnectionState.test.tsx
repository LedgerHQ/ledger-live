import React from "react";
import { DeviceInteractionRequiredType } from "@ledgerhq/live-dmk-shared";
import { DeviceIntentTrackingProvider } from "@ledgerhq/live-dmk-shared/react";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { initializerDevice } from "../testUtils";
import { AllowSecureConnectionState } from "./AllowSecureConnectionState";

describe("AllowSecureConnectionState", () => {
  it("GIVEN the allow secure connection state WHEN rendering THEN it renders the pending action copy", () => {
    // WHEN
    render(
      <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
        <AllowSecureConnectionState
          state={{ type: DeviceInteractionRequiredType.AllowSecureConnection }}
          device={initializerDevice}
          onCancel={jest.fn()}
        />
      </DeviceIntentTrackingProvider>,
    );

    // THEN
    expect(screen.getByText("Continue on your Ledger Nano X")).toBeVisible();
    expect(
      screen.getByText("Follow the instructions displayed on your Secure Screen."),
    ).toBeVisible();
  });
});
