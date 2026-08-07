import React from "react";
import { DeviceInteractionRequiredType } from "@ledgerhq/live-dmk-shared";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { initializerDevice } from "../testUtils";
import { UnlockDeviceState } from "./UnlockDeviceState";

describe("UnlockDeviceState", () => {
  it("GIVEN the unlock device state WHEN rendering THEN it renders the unlock title", () => {
    // WHEN
    render(
      <UnlockDeviceState
        state={{ type: DeviceInteractionRequiredType.UnlockDevice }}
        device={initializerDevice}
        onCancel={jest.fn()}
      />,
    );

    // THEN
    expect(screen.getByText("Unlock your Ledger Nano X")).toBeVisible();
  });
});
