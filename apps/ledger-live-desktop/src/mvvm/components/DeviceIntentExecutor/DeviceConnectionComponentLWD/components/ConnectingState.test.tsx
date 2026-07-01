import React from "react";
import { ConnectDeviceUIStateTypes, type ConnectDeviceUIState } from "@ledgerhq/live-dmk-desktop";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";

import { makeKnownDevice } from "../testUtils";
import { ConnectingState } from "./ConnectingState";

type ConnectingUIState = Extract<
  ConnectDeviceUIState,
  { type: ConnectDeviceUIStateTypes.Connecting }
>;

describe("ConnectingState", () => {
  it("GIVEN a connecting state WHEN rendering THEN it shows the loading title", () => {
    // GIVEN
    const state: ConnectingUIState = {
      type: ConnectDeviceUIStateTypes.Connecting,
      device: makeKnownDevice(),
    };

    // WHEN
    render(<ConnectingState state={state} />);

    // THEN
    expect(screen.getByText("Loading")).toBeVisible();
  });
});
