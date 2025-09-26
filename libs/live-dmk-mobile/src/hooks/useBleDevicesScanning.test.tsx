import React from "react";
import * as dmkUtils from "./useDeviceManagementKit";
import { mapDiscoveredDeviceToScannedDevice, useBleDevicesScanning } from "./useBleDevicesScanning";
import { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { Observable } from "rxjs";
import { act, render } from "@testing-library/react";

const TestComponent = () => {
  const { scannedDevices, scanningBleError } = useBleDevicesScanning(true);
  return (
    <div>
      <span data-testid="devices">{JSON.stringify(scannedDevices)}</span>
      <span data-testid="scan-error">{String(scanningBleError)}</span>
    </div>
  );
};

const dmk = dmkUtils.getDeviceManagementKit();

describe("defaultMapper", () => {
  it("should return correct devices", () => {
    // given
    const discoveredDevice = [
      {
        id: "id0",
        name: "name0",
        deviceModel: {
          model: "flex",
        },
      },
      {
        id: "id1",
        name: "name1",
        deviceModel: {
          model: "stax",
        },
      },
      {
        id: "id2",
        name: "name2",
        deviceModel: {
          model: "nanoX",
        },
      },
      {
        id: "id3",
        name: "name3",
        deviceModel: {
          model: "nanoS",
        },
      },
      {
        id: "id4",
        name: "name4",
        deviceModel: {
          model: "nanoSP",
        },
      },
    ] as DiscoveredDevice[];
    // when
    const devices = discoveredDevice.map(mapDiscoveredDeviceToScannedDevice);
    // then
    expect(devices).toEqual([
      {
        deviceId: "id0",
        deviceName: "name0",
        modelId: "europa",
        wired: false,
        isAlreadyKnown: false,
      },
      {
        deviceId: "id1",
        deviceName: "name1",
        modelId: "stax",
        wired: false,
        isAlreadyKnown: false,
      },
      {
        deviceId: "id2",
        deviceName: "name2",
        modelId: "nanoX",
        wired: false,
        isAlreadyKnown: false,
      },
      {
        deviceId: "id3",
        deviceName: "name3",
        modelId: "nanoS",
        wired: false,
        isAlreadyKnown: false,
      },
      {
        deviceId: "id4",
        deviceName: "name4",
        modelId: "nanoSP",
        wired: false,
        isAlreadyKnown: false,
      },
    ]);
  });
});

describe("useBleDevicesScanning", () => {
  beforeEach(() => {
    vi.spyOn(dmkUtils, "useDeviceManagementKit").mockReturnValue(dmk);
    vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(new Observable());
  });

  it("should scan and map devices", async () => {
    // given
    let result: ReturnType<typeof render> | undefined;
    const scannedDevices = [
      {
        id: "id0",
        name: "name0",
        deviceModel: {
          model: "flex",
        },
        rssi: 42,
      },
      {
        id: "id1",
        name: "name1",
        deviceModel: {
          model: "stax",
        },
        rssi: 32,
      },
      {
        id: "id2",
        name: "name2",
        deviceModel: {
          model: "nanoX",
        },
        rssi: 63,
      },
    ] as DiscoveredDevice[];
    vi.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(
      new Observable(subscriber => {
        subscriber.next(scannedDevices);
      }),
    );

    // when
    await act(async () => {
      result = render(<TestComponent />);
    });
    if (!result) {
      throw new Error("Result is undefined");
    }
    const { getByTestId } = result!;
    const devices = getByTestId("devices");
    const scanError = getByTestId("scan-error");

    // then
    expect(devices).toHaveTextContent(
      JSON.stringify(scannedDevices.map(mapDiscoveredDeviceToScannedDevice)),
    );
    expect(scanError).toHaveTextContent("null");
  });

  it("should set an error", async () => {
    // given
    let result: ReturnType<typeof render> | undefined;
    vi.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(
      new Observable(subscriber => {
        subscriber.error(new Error("scan error"));
      }),
    );

    // when
    await act(async () => {
      result = render(<TestComponent />);
    });
    if (!result) {
      throw new Error("Result is undefined");
    }
    const { getByTestId } = result!;
    const devices = getByTestId("devices");
    const scanError = getByTestId("scan-error");

    // then
    expect(devices).toHaveTextContent(JSON.stringify([]));
    expect(scanError).toHaveTextContent("Error: scan error");
  });
});
