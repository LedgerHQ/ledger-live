import React from "react";
import { getProductName } from "@ledgerhq/devices";
import { ConnectDeviceUIStateTypes, type ConnectDeviceUIState } from "@ledgerhq/live-dmk-desktop";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";

import { makeKnownDevice } from "../testUtils";
import { WaitingForSelectedDeviceState } from "./WaitingForSelectedDeviceState";

jest.mock("~/renderer/components/DeviceAction/animations", () => ({
  getDeviceAnimation: jest.fn(() => undefined),
}));

jest.mock("~/renderer/hooks/useTheme", () => () => ({ theme: "dark" }));

type WaitingForSelectedDeviceUIState = Extract<
  ConnectDeviceUIState,
  { type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice }
>;

function renderState(device: WaitingForSelectedDeviceUIState["device"]) {
  return render(
    <WaitingForSelectedDeviceState
      state={{
        type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice,
        device,
      }}
    />,
  );
}

describe("WaitingForSelectedDeviceState", () => {
  it("GIVEN a selected device with a name WHEN rendering THEN it shows the device name and product-specific title", () => {
    // WHEN
    renderState(makeKnownDevice({ name: "My Ledger" }));

    // THEN
    expect(screen.getByText("My Ledger")).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: new RegExp(
          `Power on and unlock your ${getProductName(DeviceModelId.nanoX).replace(
            /\u00a0/g,
            "\\s+",
          )}`,
        ),
      }),
    ).toBeVisible();
  });

  it("GIVEN a selected device without a name WHEN rendering THEN it falls back to the product name", () => {
    // WHEN
    renderState(makeKnownDevice({ name: null }));

    // THEN
    const [deviceNameLabel] = screen.getAllByText(
      new RegExp(getProductName(DeviceModelId.nanoX).replace(/\u00a0/g, "\\s+")),
    );
    expect(deviceNameLabel).toBeVisible();
  });
});
