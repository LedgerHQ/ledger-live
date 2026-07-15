import React from "react";
import { ConnectDeviceUIStateTypes, type ConnectDeviceUIState } from "@ledgerhq/live-dmk-desktop";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";

import { makeDisplayedDevice, makeKnownDevice } from "../testUtils";
import { DiscoveringState } from "./DiscoveringState";

type DiscoveringUIState = Extract<
  ConnectDeviceUIState,
  { type: ConnectDeviceUIStateTypes.Discovering }
>;

function renderState(state: Partial<DiscoveringUIState> = {}) {
  return render(
    <DiscoveringState
      state={{
        type: ConnectDeviceUIStateTypes.Discovering,
        devices: [
          makeDisplayedDevice({
            type: "available",
            knownDevice: makeKnownDevice({ name: "Available Ledger" }),
          }),
          makeDisplayedDevice({
            type: "not-available",
            knownDevice: makeKnownDevice({ name: "Unavailable Ledger" }),
          }),
        ],
        ...state,
      }}
    />,
  );
}

describe("DiscoveringState", () => {
  it("GIVEN an available device WHEN rendering THEN it asks the user to select a device", () => {
    // WHEN
    renderState();

    // THEN
    expect(screen.getByText("Select a device")).toBeVisible();
    expect(screen.getByText("Available Ledger")).toBeVisible();
    expect(screen.getByText("Unavailable Ledger")).toBeVisible();
  });

  it("GIVEN no available device WHEN rendering THEN it asks the user to power on and unlock a device", () => {
    // WHEN
    renderState({
      devices: [
        makeDisplayedDevice({
          type: "not-available",
          knownDevice: makeKnownDevice({ name: "Unavailable Ledger" }),
        }),
      ],
    });

    // THEN
    expect(screen.getByText("Power on and unlock a device")).toBeVisible();
    expect(screen.getByText("Unavailable Ledger")).toBeVisible();
  });

  it("GIVEN a selectable device WHEN clicking the row THEN it forwards the selection callback", async () => {
    // GIVEN
    const onSelect = jest.fn();
    const { user } = renderState({
      devices: [
        makeDisplayedDevice({
          knownDevice: makeKnownDevice({ name: "My Ledger" }),
          onSelect,
        }),
      ],
    });

    // WHEN
    await user.click(screen.getByText("My Ledger"));

    // THEN
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
