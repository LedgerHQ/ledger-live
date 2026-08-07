import React from "react";
import { DeviceInteractionRequiredType } from "@ledgerhq/live-dmk-shared";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { initializerDevice } from "../testUtils";
import { ConfirmOpenAppState } from "./ConfirmOpenAppState";

describe("ConfirmOpenAppState", () => {
  it("GIVEN the confirm open app state WHEN rendering THEN it renders the pending action copy", () => {
    // WHEN
    render(
      <ConfirmOpenAppState
        state={{ type: DeviceInteractionRequiredType.ConfirmOpenApp }}
        device={initializerDevice}
        onCancel={jest.fn()}
      />,
    );

    // THEN
    expect(screen.getByText("Continue on your Ledger Nano X")).toBeVisible();
    expect(
      screen.getByText("Follow the instructions displayed on your Secure Screen."),
    ).toBeVisible();
  });
});
