import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import * as dmkUtils from "./useDeviceManagementKit";
import { mapDiscoveredDeviceToScannedDevice, useBleDevicesScanning } from "./useBleDevicesScanning";
import { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { Observable, Subject } from "rxjs";
import { renderHook, act } from "@testing-library/react";
import { BleState, useBleState } from "./useBleState";

jest.mock("./useDeviceManagementKit", () => ({
  getDeviceManagementKit: jest.fn(),
  useDeviceManagementKit: jest.fn(),
}));

const dmk = {
  getDeviceSessionState: jest.fn(),
  listenToAvailableDevices: jest.fn(),
  stopDiscovering: jest.fn(),
} as unknown as DeviceManagementKit;

// Mock device data for tests
const mockDevice1 = {
  id: "device1",
  name: "Test Device 1",
  deviceModel: { model: "nanoX" },
  transport: "ble",
} as DiscoveredDevice;

const mockDevice2 = {
  id: "device2",
  name: "Test Device 2",
  deviceModel: { model: "nanoS" },
  transport: "ble",
} as DiscoveredDevice;

const mockDevices = [mockDevice1, mockDevice2];

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
        transport: "ble",
      },
      {
        id: "id1",
        name: "name1",
        deviceModel: {
          model: "stax",
        },
        transport: "ble",
      },
      {
        id: "id2",
        name: "name2",
        deviceModel: {
          model: "nanoX",
        },
        transport: "ble",
      },
      {
        id: "id3",
        name: "name3",
        deviceModel: {
          model: "nanoS",
        },
        transport: "ble",
      },
      {
        id: "id4",
        name: "name4",
        deviceModel: {
          model: "nanoSP",
        },
        transport: "ble",
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
        discoveredDevice: discoveredDevice[0],
      },
      {
        deviceId: "id1",
        deviceName: "name1",
        modelId: "stax",
        wired: false,
        discoveredDevice: discoveredDevice[1],
      },
      {
        deviceId: "id2",
        deviceName: "name2",
        modelId: "nanoX",
        wired: false,
        discoveredDevice: discoveredDevice[2],
      },
      {
        deviceId: "id3",
        deviceName: "name3",
        modelId: "nanoS",
        wired: false,
        discoveredDevice: discoveredDevice[3],
      },
      {
        deviceId: "id4",
        deviceName: "name4",
        modelId: "nanoSP",
        wired: false,
        discoveredDevice: discoveredDevice[4],
      },
    ]);
  });
});

// Mock useBleState
jest.mock("./useBleState", () => ({
  useBleState: jest.fn(),
  BleState: {
    Unknown: "Unknown",
    Resetting: "Resetting",
    Unsupported: "Unsupported",
    Unauthorized: "Unauthorized",
    PoweredOff: "PoweredOff",
    PoweredOn: "PoweredOn",
  },
  UndeterminedBleStates: ["Unknown", "Resetting"],
}));

describe("useBleDevicesScanning", () => {
  const mockUseBleState = jest.mocked(useBleState);
  const mockListenToAvailableDevices = jest.fn();
  const mockStopDiscovering = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(dmkUtils.getDeviceManagementKit).mockReturnValue(dmk);
    jest.mocked(dmkUtils.useDeviceManagementKit).mockReturnValue(dmk);
    dmk.getDeviceSessionState.mockReturnValue(new Observable());
    dmk.listenToAvailableDevices.mockImplementation(mockListenToAvailableDevices);
    dmk.stopDiscovering.mockImplementation(mockStopDiscovering);
  });

  it("should scan and map devices", async () => {
    // given
    mockUseBleState.mockReturnValue(BleState.PoweredOn);
    const scannedDevices = [
      {
        id: "id0",
        name: "name0",
        deviceModel: {
          model: "flex",
        },
        rssi: 42,
        transport: "ble",
      },
      {
        id: "id1",
        name: "name1",
        deviceModel: {
          model: "stax",
        },
        rssi: 32,
        transport: "ble",
      },
      {
        id: "id2",
        name: "name2",
        deviceModel: {
          model: "nanoX",
        },
        rssi: 63,
        transport: "ble",
      },
    ] as DiscoveredDevice[];

    mockListenToAvailableDevices.mockReturnValue(
      new Observable(subscriber => {
        subscriber.next(scannedDevices);
      }),
    );

    // when
    const { result } = renderHook(() => useBleDevicesScanning(true));

    // then
    expect(result.current.scannedDevices).toEqual(
      scannedDevices.map(mapDiscoveredDeviceToScannedDevice),
    );
    expect(result.current.scanningBleError).toBeNull();
    expect(result.current.isScanning).toBe(true);
  });

  it("should start scanning when BLE state changes from non-scanning to scanning state", async () => {
    // given
    mockUseBleState.mockReturnValue(BleState.PoweredOff);
    mockListenToAvailableDevices.mockReturnValue(new Observable());

    const { result, rerender } = renderHook(() => useBleDevicesScanning(true));

    // Initially should not be scanning
    expect(result.current.isScanning).toBe(false);
    expect(mockListenToAvailableDevices).not.toHaveBeenCalled();

    // when BLE state changes to PoweredOn
    mockUseBleState.mockReturnValue(BleState.PoweredOn);
    rerender();

    // then
    expect(result.current.isScanning).toBe(true);
    expect(mockListenToAvailableDevices).toHaveBeenCalled();
  });

  it("should stop scanning when BLE state changes from scanning to non-scanning state", async () => {
    // given
    mockUseBleState.mockReturnValue(BleState.PoweredOn);
    const subject = new Subject<DiscoveredDevice[]>();
    mockListenToAvailableDevices.mockReturnValue(subject.asObservable());

    const { result, rerender } = renderHook(() => useBleDevicesScanning(true));

    // First emit some devices to populate the array
    act(() => {
      subject.next([mockDevice1]);
    });

    // Verify devices are populated
    expect(result.current.scannedDevices).toHaveLength(1);
    expect(result.current.isScanning).toBe(true);

    // when BLE state changes to PoweredOff
    mockUseBleState.mockReturnValue(BleState.PoweredOff);
    rerender();

    // then
    expect(result.current.isScanning).toBe(false);
    expect(result.current.scannedDevices).toEqual([]);
    expect(mockStopDiscovering).toHaveBeenCalled();
  });

  it("should start scanning when enabled changes from false to true with BLE powered on", async () => {
    // given
    mockUseBleState.mockReturnValue(BleState.PoweredOn);
    mockListenToAvailableDevices.mockReturnValue(new Observable());

    const { result, rerender } = renderHook(({ enabled }) => useBleDevicesScanning(enabled), {
      initialProps: { enabled: false },
    });

    // Initially should not be scanning
    expect(result.current.isScanning).toBe(false);
    expect(mockListenToAvailableDevices).not.toHaveBeenCalled();

    // when enabled changes to true
    rerender({ enabled: true });

    // then
    expect(result.current.isScanning).toBe(true);
    expect(mockListenToAvailableDevices).toHaveBeenCalled();
  });

  it("should stop scanning when enabled changes from true to false with BLE powered on", async () => {
    // given
    mockUseBleState.mockReturnValue(BleState.PoweredOn);
    const subject = new Subject<DiscoveredDevice[]>();
    mockListenToAvailableDevices.mockReturnValue(subject.asObservable());

    const { result, rerender } = renderHook(({ enabled }) => useBleDevicesScanning(enabled), {
      initialProps: { enabled: true },
    });

    // First emit some devices to populate the array
    act(() => {
      subject.next(mockDevices);
    });

    // Verify devices are populated
    expect(result.current.scannedDevices).toHaveLength(2);
    expect(result.current.isScanning).toBe(true);

    // when enabled changes to false
    rerender({ enabled: false });

    // then
    expect(result.current.isScanning).toBe(false);
    expect(result.current.scannedDevices).toEqual([]);
    expect(mockStopDiscovering).toHaveBeenCalled();
  });

  it("should unsubscribe and cleanup on error", async () => {
    mockUseBleState.mockReturnValue(BleState.PoweredOn);
    const subject = new Subject<DiscoveredDevice[]>();
    mockListenToAvailableDevices.mockReturnValue(subject.asObservable());

    const { result } = renderHook(() => useBleDevicesScanning(true));

    // First emit some devices to populate the array
    act(() => {
      subject.next([mockDevice1]);
    });

    // Verify devices are populated
    expect(result.current.scannedDevices).toHaveLength(1);
    expect(result.current.isScanning).toBe(true);

    // Trigger error
    const error = new Error("boom");
    act(() => {
      subject.error(error);
    });

    expect(result.current.isScanning).toBe(false);
    expect(result.current.scannedDevices).toEqual([]);
    expect(result.current.scanningBleError).toBe(error);
    expect(mockStopDiscovering).toHaveBeenCalled();
  });

  it("should unsubscribe and cleanup on complete", async () => {
    mockUseBleState.mockReturnValue(BleState.PoweredOn);
    const subject = new Subject<DiscoveredDevice[]>();
    mockListenToAvailableDevices.mockReturnValue(subject.asObservable());

    const { result } = renderHook(() => useBleDevicesScanning(true));

    // First emit some devices to populate the array
    act(() => {
      subject.next([mockDevice1]);
    });

    // Verify devices are populated
    expect(result.current.scannedDevices).toHaveLength(1);
    expect(result.current.isScanning).toBe(true);

    // Trigger complete
    act(() => {
      subject.complete();
    });

    expect(result.current.isScanning).toBe(false);
    expect(result.current.scannedDevices).toEqual([]);
    expect(result.current.scanningBleError).toBeNull();
    expect(mockStopDiscovering).toHaveBeenCalled();
  });

  it("should retry scanning after unexpected completion", async () => {
    jest.useFakeTimers();
    mockUseBleState.mockReturnValue(BleState.PoweredOn);

    // First attempt - completes unexpectedly
    const subject1 = new Subject<DiscoveredDevice[]>();
    // Second attempt - after retry
    const subject2 = new Subject<DiscoveredDevice[]>();

    mockListenToAvailableDevices
      .mockReturnValueOnce(subject1.asObservable())
      .mockReturnValueOnce(subject2.asObservable());

    const { result } = renderHook(() => useBleDevicesScanning(true));

    // First attempt: emit devices then complete unexpectedly
    act(() => {
      subject1.next([mockDevice1]);
      subject1.complete();
    });

    expect(result.current.isScanning).toBe(false);
    expect(result.current.scannedDevices).toEqual([]);
    expect(mockListenToAvailableDevices).toHaveBeenCalledTimes(1);

    // Fast-forward time by 5 seconds to trigger retry
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Should have retried
    expect(mockListenToAvailableDevices).toHaveBeenCalledTimes(2);
    expect(result.current.isScanning).toBe(true);

    // Second attempt succeeds
    act(() => {
      subject2.next([mockDevice1, mockDevice2]);
    });

    expect(result.current.scannedDevices).toHaveLength(2);
    expect(result.current.isScanning).toBe(true);

    jest.useRealTimers();
  });

  it("should not retry if scanning is disabled before retry timeout", async () => {
    jest.useFakeTimers();
    mockUseBleState.mockReturnValue(BleState.PoweredOn);

    const subject = new Subject<DiscoveredDevice[]>();
    mockListenToAvailableDevices.mockReturnValue(subject.asObservable());

    const { result, rerender } = renderHook(({ enabled }) => useBleDevicesScanning(enabled), {
      initialProps: { enabled: true },
    });

    // First attempt: complete unexpectedly
    act(() => {
      subject.next([mockDevice1]);
      subject.complete();
    });

    expect(result.current.isScanning).toBe(false);
    expect(mockListenToAvailableDevices).toHaveBeenCalledTimes(1);

    // Disable scanning before retry timeout
    rerender({ enabled: false });

    // Fast-forward time by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Should NOT have retried because scanning was disabled
    expect(mockListenToAvailableDevices).toHaveBeenCalledTimes(1);
    expect(result.current.isScanning).toBe(false);

    jest.useRealTimers();
  });

  it("should cleanup retry timeout on unmount", async () => {
    jest.useFakeTimers();
    mockUseBleState.mockReturnValue(BleState.PoweredOn);

    const subject = new Subject<DiscoveredDevice[]>();
    mockListenToAvailableDevices.mockReturnValue(subject.asObservable());

    const { result, unmount } = renderHook(() => useBleDevicesScanning(true));

    // First attempt: complete unexpectedly
    act(() => {
      subject.next([mockDevice1]);
      subject.complete();
    });

    expect(result.current.isScanning).toBe(false);
    expect(mockListenToAvailableDevices).toHaveBeenCalledTimes(1);

    // Unmount before retry timeout
    unmount();

    // Fast-forward time by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Should NOT have retried because component was unmounted
    expect(mockListenToAvailableDevices).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});
