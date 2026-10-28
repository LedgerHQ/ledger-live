import React from "react";
import { act, screen } from "@testing-library/react";
import { webBleTransportIdentifier } from "@ledgerhq/live-dmk-desktop";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { BluetoothSelectionRequest } from "~/bridge/contract";
import { bluetooth } from "~/renderer/bridge";
import type { State } from "~/renderer/reducers";
import { render } from "tests/testSetup";
import { BluetoothDeviceChooser } from "./BluetoothDeviceChooser";
import { takeBluetoothSelection } from "./bluetoothSelection";

const mockedBluetooth = jest.mocked(bluetooth);

const rememberedFlex: KnownDevice = {
  transport: webBleTransportIdentifier,
  id: "remembered-id",
  deviceModelId: DeviceModelId.europa,
  name: "Flex 1A2B",
};

let emitSelectionRequest: (request: BluetoothSelectionRequest) => void;
let emitSelectionEnd: (requestId: number) => void;

function renderChooser(knownDevices: KnownDevice[] = []) {
  return render(<BluetoothDeviceChooser />, {
    initialState: { knownDevices: { knownDevices } } as Partial<State>,
  });
}

describe("BluetoothDeviceChooser", () => {
  beforeEach(() => {
    takeBluetoothSelection();
    mockedBluetooth.onSelectionRequest.mockImplementation(callback => {
      emitSelectionRequest = callback;
      return () => undefined;
    });
    mockedBluetooth.onSelectionEnd.mockImplementation(callback => {
      emitSelectionEnd = callback;
      return () => undefined;
    });
  });

  it("GIVEN a remembered device in the scan WHEN a request arrives THEN it selects it without showing the list", () => {
    renderChooser([rememberedFlex]);

    act(() =>
      emitSelectionRequest({
        requestId: 1,
        devices: [
          { deviceId: "stranger-id", deviceName: "Flex FFFF" },
          { deviceId: "remembered-id", deviceName: "Flex 1A2B" },
        ],
      }),
    );

    expect(mockedBluetooth.selectDevice).toHaveBeenCalledWith(1, "remembered-id");
    expect(screen.queryByTestId("bluetooth-device-chooser")).toBeNull();
    expect(takeBluetoothSelection()).toEqual({ type: "selected", deviceId: "remembered-id" });
  });

  it("GIVEN only unknown devices WHEN the scan grows THEN it lists them live and never auto-selects", () => {
    renderChooser([rememberedFlex]);

    act(() => emitSelectionRequest({ requestId: 1, devices: [] }));
    expect(screen.getByText("Searching for Ledger devices nearby…")).toBeVisible();

    act(() =>
      emitSelectionRequest({
        requestId: 1,
        devices: [
          { deviceId: "a", deviceName: "Stax 0001" },
          { deviceId: "b", deviceName: "Nano X 0002" },
        ],
      }),
    );

    expect(screen.getByText("Stax 0001")).toBeVisible();
    expect(screen.getByText("Nano X 0002")).toBeVisible();
    expect(mockedBluetooth.selectDevice).not.toHaveBeenCalled();
  });

  it("GIVEN the list WHEN the user picks a device THEN it answers the request with that device", async () => {
    const { user } = renderChooser();
    act(() =>
      emitSelectionRequest({ requestId: 7, devices: [{ deviceId: "a", deviceName: "Stax 0001" }] }),
    );

    await user.click(screen.getByText("Stax 0001"));

    expect(mockedBluetooth.selectDevice).toHaveBeenCalledWith(7, "a");
    expect(takeBluetoothSelection()).toEqual({ type: "selected", deviceId: "a" });
    expect(screen.queryByTestId("bluetooth-device-chooser")).toBeNull();
  });

  it("GIVEN the list WHEN the user cancels THEN it cancels the request and records the cancellation", async () => {
    const { user } = renderChooser();
    act(() =>
      emitSelectionRequest({ requestId: 3, devices: [{ deviceId: "a", deviceName: "Stax 0001" }] }),
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mockedBluetooth.selectDevice).toHaveBeenCalledWith(3, null);
    expect(takeBluetoothSelection()).toEqual({ type: "cancelled" });
  });

  it("GIVEN an answered request WHEN the scan reports it again THEN the list stays closed", async () => {
    const { user } = renderChooser();
    const request = { requestId: 4, devices: [{ deviceId: "a", deviceName: "Stax 0001" }] };
    act(() => emitSelectionRequest(request));
    await user.click(screen.getByText("Stax 0001"));

    act(() => emitSelectionRequest(request));

    expect(screen.queryByTestId("bluetooth-device-chooser")).toBeNull();
    expect(mockedBluetooth.selectDevice).toHaveBeenCalledTimes(1);
  });

  it("GIVEN the list WHEN the main process ends the request THEN it closes without answering", () => {
    renderChooser();
    act(() =>
      emitSelectionRequest({ requestId: 5, devices: [{ deviceId: "a", deviceName: "Stax 0001" }] }),
    );

    act(() => emitSelectionEnd(5));

    expect(screen.queryByTestId("bluetooth-device-chooser")).toBeNull();
    expect(mockedBluetooth.selectDevice).not.toHaveBeenCalled();
    expect(takeBluetoothSelection()).toBeNull();
  });
});
