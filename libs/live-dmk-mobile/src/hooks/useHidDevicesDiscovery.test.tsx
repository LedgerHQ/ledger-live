import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import * as dmkUtils from "./useDeviceManagementKit";
import {
  mapDiscoveredDeviceToHIDDiscoveredDevice,
  useHidDevicesDiscovery,
} from "./useHidDevicesDiscovery";
import { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { Observable, Subject } from "rxjs";
import { renderHook, act } from "@testing-library/react";

jest.mock("./useDeviceManagementKit", () => ({
  getDeviceManagementKit: jest.fn(),
  useDeviceManagementKit: jest.fn(),
}));

jest.mock("@ledgerhq/device-transport-kit-react-native-hid", () => ({
  rnHidTransportIdentifier: "react-native-hid",
}));

const dmk = {
  getDeviceSessionState: jest.fn(),
  listenToAvailableDevices: jest.fn(),
  stopDiscovering: jest.fn(),
} as unknown as DeviceManagementKit;

// Mock device data for tests
const mockDevice1 = {
  id: "device1",
  deviceModel: { model: "nanoX", name: "Test Device 1" },
  transport: "hid",
} as DiscoveredDevice;

const mockDevice2 = {
  id: "device2",
  deviceModel: { model: "flex", name: "Test Device 2" },
  transport: "hid",
} as DiscoveredDevice;

const mockDevices = [mockDevice1, mockDevice2];

describe("mapDiscoveredDeviceToHIDDiscoveredDevice", () => {
  it("should correctly map DiscoveredDevice to HIDDiscoveredDevice", () => {
    // given
    const discoveredDevices = [
      {
        id: "id0",
        deviceModel: {
          model: "flex",
          name: "Ledger Flex",
        },
        transport: "hid",
      },
      {
        id: "id1",
        deviceModel: {
          model: "stax",
          name: "Ledger Stax",
        },
        transport: "hid",
      },
      {
        id: "id2",
        deviceModel: {
          model: "nanoX",
          name: "Ledger Nano X",
        },
        transport: "hid",
      },
      {
        id: "id3",
        deviceModel: {
          model: "nanoS",
          name: "Ledger Nano S",
        },
        transport: "hid",
      },
      {
        id: "id4",
        deviceModel: {
          model: "nanoSP",
          name: "Ledger Nano S Plus",
        },
        transport: "hid",
      },
    ] as DiscoveredDevice[];

    // when
    const devices = discoveredDevices.map(mapDiscoveredDeviceToHIDDiscoveredDevice);

    // then
    expect(devices).toEqual([
      {
        deviceId: "usb|id0",
        deviceName: "Ledger Flex",
        modelId: "europa",
        wired: true,
        discoveredDevice: discoveredDevices[0],
      },
      {
        deviceId: "usb|id1",
        deviceName: "Ledger Stax",
        modelId: "stax",
        wired: true,
        discoveredDevice: discoveredDevices[1],
      },
      {
        deviceId: "usb|id2",
        deviceName: "Ledger Nano X",
        modelId: "nanoX",
        wired: true,
        discoveredDevice: discoveredDevices[2],
      },
      {
        deviceId: "usb|id3",
        deviceName: "Ledger Nano S",
        modelId: "nanoS",
        wired: true,
        discoveredDevice: discoveredDevices[3],
      },
      {
        deviceId: "usb|id4",
        deviceName: "Ledger Nano S Plus",
        modelId: "nanoSP",
        wired: true,
        discoveredDevice: discoveredDevices[4],
      },
    ]);
  });

  it("should set wired to true", () => {
    const device = {
      id: "test-id",
      deviceModel: { model: "nanoX", name: "Ledger Nano X" },
      transport: "hid",
    } as DiscoveredDevice;

    const result = mapDiscoveredDeviceToHIDDiscoveredDevice(device);

    expect(result.wired).toBe(true);
  });

  it("should preserve the original discoveredDevice object", () => {
    const device = {
      id: "test-id",
      deviceModel: { model: "nanoX", name: "Ledger Nano X" },
      transport: "hid",
    } as DiscoveredDevice;

    const result = mapDiscoveredDeviceToHIDDiscoveredDevice(device);

    expect(result.discoveredDevice).toBe(device);
  });
});

describe("useHidDevicesDiscovery", () => {
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

  it("should discover and map devices when enabled (default)", async () => {
    // given
    const scannedDevices = [
      {
        id: "id0",
        deviceModel: {
          model: "flex",
          name: "Ledger Flex",
        },
        transport: "hid",
      },
      {
        id: "id1",
        deviceModel: {
          model: "stax",
          name: "Ledger Stax",
        },
        transport: "hid",
      },
      {
        id: "id2",
        deviceModel: {
          model: "nanoX",
          name: "Ledger Nano X",
        },
        transport: "hid",
      },
    ] as DiscoveredDevice[];

    mockListenToAvailableDevices.mockReturnValue(
      new Observable(subscriber => {
        subscriber.next(scannedDevices);
      }),
    );

    // when
    const { result } = renderHook(() => useHidDevicesDiscovery());

    // then
    expect(result.current.hidDevices).toEqual(
      scannedDevices.map(mapDiscoveredDeviceToHIDDiscoveredDevice),
    );
    expect(result.current.error).toBeNull();
    expect(mockListenToAvailableDevices).toHaveBeenCalledWith({
      transport: "react-native-hid",
    });
  });

  it("should not start discovery when enabled is false", async () => {
    // given
    mockListenToAvailableDevices.mockReturnValue(new Observable());

    // when
    const { result } = renderHook(() => useHidDevicesDiscovery(false));

    // then
    expect(result.current.hidDevices).toEqual([]);
    expect(mockListenToAvailableDevices).not.toHaveBeenCalled();
  });

  it("should start discovery when enabled changes from false to true", async () => {
    // given
    mockListenToAvailableDevices.mockReturnValue(new Observable());

    const { result, rerender } = renderHook(({ enabled }) => useHidDevicesDiscovery(enabled), {
      initialProps: { enabled: false },
    });

    // Initially should not be discovering
    expect(result.current.hidDevices).toEqual([]);
    expect(mockListenToAvailableDevices).not.toHaveBeenCalled();

    // when enabled changes to true
    rerender({ enabled: true });

    // then
    expect(mockListenToAvailableDevices).toHaveBeenCalled();
  });

  it("should stop discovery when enabled changes from true to false", async () => {
    // given
    const subject = new Subject<DiscoveredDevice[]>();
    mockListenToAvailableDevices.mockReturnValue(subject.asObservable());

    const { result, rerender } = renderHook(({ enabled }) => useHidDevicesDiscovery(enabled), {
      initialProps: { enabled: true },
    });

    // First emit some devices to populate the array
    act(() => {
      subject.next(mockDevices);
    });

    // Verify devices are populated
    expect(result.current.hidDevices).toHaveLength(2);

    // when enabled changes to false
    rerender({ enabled: false });

    // then
    expect(result.current.hidDevices).toEqual([]);
    expect(mockStopDiscovering).toHaveBeenCalled();
  });

  it("should cleanup on error", async () => {
    // given
    const subject = new Subject<DiscoveredDevice[]>();
    mockListenToAvailableDevices.mockReturnValue(subject.asObservable());

    const { result } = renderHook(() => useHidDevicesDiscovery());

    // First emit some devices to populate the array
    act(() => {
      subject.next([mockDevice1]);
    });

    // Verify devices are populated
    expect(result.current.hidDevices).toHaveLength(1);

    // Trigger error
    const error = new Error("boom");
    act(() => {
      subject.error(error);
    });

    // then
    expect(result.current.hidDevices).toEqual([]);
    expect(result.current.error).toBe(error);
    expect(mockStopDiscovering).toHaveBeenCalled();
  });

  it("should cleanup on complete", async () => {
    // given
    const subject = new Subject<DiscoveredDevice[]>();
    mockListenToAvailableDevices.mockReturnValue(subject.asObservable());

    const { result } = renderHook(() => useHidDevicesDiscovery());

    // First emit some devices to populate the array
    act(() => {
      subject.next([mockDevice1]);
    });

    // Verify devices are populated
    expect(result.current.hidDevices).toHaveLength(1);

    // Trigger complete
    act(() => {
      subject.complete();
    });

    // then
    expect(result.current.hidDevices).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(mockStopDiscovering).toHaveBeenCalled();
  });

  it("should cleanup on unmount", async () => {
    // given
    const subject = new Subject<DiscoveredDevice[]>();
    mockListenToAvailableDevices.mockReturnValue(subject.asObservable());

    const { result, unmount } = renderHook(() => useHidDevicesDiscovery());

    // First emit some devices to populate the array
    act(() => {
      subject.next([mockDevice1]);
    });

    // Verify devices are populated
    expect(result.current.hidDevices).toHaveLength(1);

    // when unmounting
    unmount();

    // then
    expect(mockStopDiscovering).toHaveBeenCalled();
  });

  it("should not start discovery when dmk is null", async () => {
    // given
    jest.mocked(dmkUtils.useDeviceManagementKit).mockReturnValue(null);
    mockListenToAvailableDevices.mockReturnValue(new Observable());

    // when
    const { result } = renderHook(() => useHidDevicesDiscovery());

    // then
    expect(result.current.hidDevices).toEqual([]);
    expect(mockListenToAvailableDevices).not.toHaveBeenCalled();
  });
});
