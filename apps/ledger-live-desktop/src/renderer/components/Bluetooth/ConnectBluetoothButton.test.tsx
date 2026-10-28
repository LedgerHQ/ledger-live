import React from "react";
import { screen, waitFor } from "@testing-library/react";
import type { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import {
  isBluetoothTransportEnabled,
  requestBluetoothDevice,
  useDeviceManagementKit,
  webBleTransportIdentifier,
} from "@ledgerhq/live-dmk-desktop";
import { ledgerToDmkDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render } from "tests/testSetup";
import { ConnectBluetoothButton } from "./ConnectBluetoothButton";
import { recordBluetoothSelection } from "./bluetoothSelection";

jest.mock("@ledgerhq/live-dmk-desktop", () => ({
  ...jest.requireActual("@ledgerhq/live-dmk-desktop"),
  isBluetoothTransportEnabled: jest.fn(),
  requestBluetoothDevice: jest.fn(),
  useDeviceManagementKit: jest.fn(),
}));

const mockedIsBluetoothTransportEnabled = jest.mocked(isBluetoothTransportEnabled);
const mockedRequestBluetoothDevice = jest.mocked(requestBluetoothDevice);
const mockedUseDeviceManagementKit = jest.mocked(useDeviceManagementKit);

const CHOOSER_DEVICE_ID = "chooser-device-id";

const discoveredFlex = {
  id: "dmk-device-id",
  name: "Flex 1A2B",
  deviceModel: { model: ledgerToDmkDeviceIdMap[DeviceModelId.europa] },
  transport: webBleTransportIdentifier,
} as unknown as DiscoveredDevice;

const CONNECT_LABEL = "Connect with Bluetooth";

describe("ConnectBluetoothButton", () => {
  beforeEach(() => {
    mockedIsBluetoothTransportEnabled.mockReturnValue(true);
    mockedUseDeviceManagementKit.mockReturnValue({} as unknown as DeviceManagementKit);
  });

  it("GIVEN the Bluetooth transport is disabled WHEN rendering THEN it renders nothing", () => {
    mockedIsBluetoothTransportEnabled.mockReturnValue(false);

    render(<ConnectBluetoothButton deviceModelId={DeviceModelId.europa} />);

    expect(screen.queryByText(CONNECT_LABEL)).toBeNull();
  });

  it("GIVEN a model without Bluetooth WHEN rendering THEN it renders nothing", () => {
    render(<ConnectBluetoothButton deviceModelId={DeviceModelId.nanoSP} />);

    expect(screen.queryByText(CONNECT_LABEL)).toBeNull();
  });

  it("GIVEN the user picks a device WHEN the request succeeds THEN it remembers it with the chooser id", async () => {
    mockedRequestBluetoothDevice.mockImplementation(async () => {
      recordBluetoothSelection({ type: "selected", deviceId: CHOOSER_DEVICE_ID });
      return discoveredFlex;
    });
    const { user, store } = render(<ConnectBluetoothButton deviceModelId={DeviceModelId.europa} />);

    await user.click(screen.getByText(CONNECT_LABEL));

    await waitFor(() =>
      expect(store.getState().knownDevices.knownDevices).toEqual([
        {
          transport: webBleTransportIdentifier,
          id: CHOOSER_DEVICE_ID,
          deviceModelId: DeviceModelId.europa,
          name: "Flex 1A2B",
        },
      ]),
    );
    expect(screen.queryByText(/Connection failed/)).toBeNull();
  });

  it("GIVEN the request is pending WHEN rendering THEN the button is disabled", async () => {
    // Never settles: the chooser is still open. Executor form: the ES2022 lib lacks withResolvers.
    mockedRequestBluetoothDevice.mockReturnValue(new Promise<DiscoveredDevice>(() => undefined));
    const { user } = render(<ConnectBluetoothButton deviceModelId={DeviceModelId.europa} />);

    await user.click(screen.getByText(CONNECT_LABEL));

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("GIVEN the user cancels the chooser WHEN the request rejects THEN it shows the cancellation message", async () => {
    mockedRequestBluetoothDevice.mockImplementation(async () => {
      recordBluetoothSelection({ type: "cancelled" });
      throw new Error("User cancelled the requestDevice() chooser.");
    });
    const { user, store } = render(<ConnectBluetoothButton deviceModelId={DeviceModelId.europa} />);

    await user.click(screen.getByText(CONNECT_LABEL));

    expect(await screen.findByText("Bluetooth connection cancelled.")).toBeVisible();
    expect(screen.queryByText(/Connection failed/)).toBeNull();
    expect(store.getState().knownDevices.knownDevices).toEqual([]);
  });

  it("GIVEN no device answers WHEN the request rejects THEN it shows the failure message", async () => {
    mockedRequestBluetoothDevice.mockRejectedValue(new Error("GATT connection failed"));
    const { user } = render(<ConnectBluetoothButton deviceModelId={DeviceModelId.europa} />);

    await user.click(screen.getByText(CONNECT_LABEL));

    expect(await screen.findByText(/Connection failed/)).toBeVisible();
    expect(screen.queryByText("Bluetooth connection cancelled.")).toBeNull();
  });

  it("GIVEN Chromium cancels the first scan right away WHEN connecting THEN it retries once and succeeds", async () => {
    const chromiumCancel = Object.assign(new Error("User cancelled the requestDevice() chooser."), {
      name: "NotFoundError",
    });
    mockedRequestBluetoothDevice.mockReset();
    mockedRequestBluetoothDevice
      .mockRejectedValueOnce(chromiumCancel)
      .mockImplementationOnce(async () => {
        recordBluetoothSelection({ type: "selected", deviceId: CHOOSER_DEVICE_ID });
        return discoveredFlex;
      });
    const { user, store } = render(<ConnectBluetoothButton deviceModelId={DeviceModelId.europa} />);

    await user.click(screen.getByText(CONNECT_LABEL));

    await waitFor(() => expect(store.getState().knownDevices.knownDevices).toHaveLength(1));
    expect(mockedRequestBluetoothDevice).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(/Connection failed/)).toBeNull();
  });

  it("GIVEN the user cancels the chooser WHEN the scan ends with NotFoundError THEN it does not retry", async () => {
    mockedRequestBluetoothDevice.mockReset();
    mockedRequestBluetoothDevice.mockImplementation(async () => {
      recordBluetoothSelection({ type: "cancelled" });
      throw Object.assign(new Error("User cancelled the requestDevice() chooser."), {
        name: "NotFoundError",
      });
    });
    const { user } = render(<ConnectBluetoothButton deviceModelId={DeviceModelId.europa} />);

    await user.click(screen.getByText(CONNECT_LABEL));

    expect(await screen.findByText("Bluetooth connection cancelled.")).toBeVisible();
    expect(mockedRequestBluetoothDevice).toHaveBeenCalledTimes(1);
  });
});
