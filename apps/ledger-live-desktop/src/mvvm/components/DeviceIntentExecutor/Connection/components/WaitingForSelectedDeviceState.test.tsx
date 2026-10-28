import React from "react";
import { getProductName } from "@ledgerhq/devices";
import {
  ConnectDeviceUIStateTypes,
  webBleTransportIdentifier,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-desktop";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";

import { DeviceIntentTrackingTestWrapper, makeKnownDevice } from "../testUtils";
import { WaitingForSelectedDeviceState } from "./WaitingForSelectedDeviceState";

jest.mock("~/renderer/components/DeviceAction/animations", () => ({
  getDeviceAnimation: jest.fn(() => undefined),
}));

jest.mock("~/renderer/hooks/useTheme", () => () => ({ theme: "dark" }));

type WaitingForSelectedDeviceUIState = Extract<
  ConnectDeviceUIState,
  { type: typeof ConnectDeviceUIStateTypes.WaitingForSelectedDevice }
>;

const bluetooth = { status: "idle" as const, onConnect: jest.fn() };

function renderState(
  device: WaitingForSelectedDeviceUIState["device"],
  bluetoothViewModel: typeof bluetooth | null = null,
) {
  return render(
    <WaitingForSelectedDeviceState
      state={{
        type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice,
        device,
      }}
      bluetooth={bluetoothViewModel}
    />,
    { wrapper: DeviceIntentTrackingTestWrapper },
  );
}

describe("WaitingForSelectedDeviceState", () => {
  it("GIVEN the only known device is a Bluetooth one WHEN waiting for it THEN the user can scan for it", async () => {
    // GIVEN
    const { user } = renderState(
      makeKnownDevice({ name: "0E70", transport: webBleTransportIdentifier }),
      bluetooth,
    );

    // WHEN
    await user.click(screen.getByRole("button", { name: "Connect with Bluetooth" }));

    // THEN
    expect(bluetooth.onConnect).toHaveBeenCalledTimes(1);
  });

  it("GIVEN a USB device WHEN waiting for it THEN no Bluetooth button is shown", () => {
    // WHEN
    renderState(makeKnownDevice({ name: "My Ledger" }), bluetooth);

    // THEN
    expect(screen.queryByRole("button", { name: "Connect with Bluetooth" })).toBeNull();
  });

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
