import { act, renderHook } from "@testing-library/react-native";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { __testUtils, useMockBleDevicesScanning } from "./useMockBle";
import { DeviceLike } from "~/reducers/types";

const mockOpen = jest.fn();
type MockAddPayload = {
  id: string;
  name: string;
  serviceUUID?: string;
  serviceUUIDs?: string[];
};

type MockBridgeMessage =
  | {
      type: "add";
      payload: MockAddPayload;
    }
  | {
      type: "importBle";
    };

jest.mock("./index", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    open: mockOpen,
  })),
}));

const createKnownDevice = (overrides: Partial<DeviceLike> = {}): DeviceLike => ({
  id: "mock_1",
  name: "Nano X",
  modelId: DeviceModelId.nanoX,
  ...overrides,
});

const emitBridgeMessage = (message: MockBridgeMessage) => {
  act(() => {
    __testUtils.emitMockBleBridgeMessage(message);
  });
};

const emitScannedBleDevice = (
  device: Pick<DeviceLike, "id" | "name" | "modelId">,
  extraPayload: Partial<MockAddPayload> = {},
) => {
  const serviceUUID = getDeviceModel(device.modelId).bluetoothSpec?.[0]?.serviceUuid;

  if (!serviceUUID) {
    throw new Error(`Missing bluetooth service UUID for ${device.modelId}`);
  }

  emitBridgeMessage({
    type: "add",
    payload: {
      id: device.id,
      name: device.name,
      serviceUUID,
      ...extraPayload,
    },
  });
};

describe("useMockBleDevicesScanning", () => {
  beforeEach(() => {
    __testUtils.resetMockBleScannedDevices();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should not treat imported known devices as scanned devices", () => {
    const { result } = renderHook(() => useMockBleDevicesScanning(true));

    emitBridgeMessage({
      type: "importBle",
    });

    expect(result.current.scannedDevices).toEqual([]);
  });

  it("should retain bridge-emitted scanned BLE devices across screen mounts", () => {
    const knownDevice = createKnownDevice();
    const { result, unmount } = renderHook(() => useMockBleDevicesScanning(true));

    emitScannedBleDevice(knownDevice);

    expect(result.current.scannedDevices).toMatchObject([
      {
        deviceId: knownDevice.id,
        deviceName: knownDevice.name,
        modelId: knownDevice.modelId,
        wired: false,
        discoveredDevice: {
          id: knownDevice.id,
          name: knownDevice.name,
          transport: "BLE",
        },
      },
    ]);

    unmount();

    const { result: remountedResult } = renderHook(() => useMockBleDevicesScanning(true));

    expect(remountedResult.current.scannedDevices).toMatchObject([
      {
        deviceId: knownDevice.id,
        deviceName: knownDevice.name,
        modelId: knownDevice.modelId,
        wired: false,
      },
    ]);
  });

  it("should derive the scanned device model from the bluetooth service UUID", () => {
    const scannedDevice = createKnownDevice({
      id: "mock_4",
      name: "Stax",
      modelId: DeviceModelId.stax,
    });
    const { result } = renderHook(() => useMockBleDevicesScanning(true));

    emitScannedBleDevice(scannedDevice);

    expect(result.current.scannedDevices).toMatchObject([
      {
        deviceId: scannedDevice.id,
        deviceName: scannedDevice.name,
        modelId: DeviceModelId.stax,
        wired: false,
      },
    ]);
  });

  it("should handle the mock descriptor shape with serviceUUIDs", () => {
    const { result } = renderHook(() => useMockBleDevicesScanning(true));

    emitBridgeMessage({
      type: "add",
      payload: {
        id: "mock_4",
        name: "Stax",
        serviceUUIDs: [getDeviceModel(DeviceModelId.stax).bluetoothSpec?.[0]?.serviceUuid ?? ""],
      },
    });

    expect(result.current.scannedDevices).toMatchObject([
      {
        deviceId: "mock_4",
        deviceName: "Stax",
        modelId: DeviceModelId.stax,
        wired: false,
      },
    ]);
  });

  it("should fall back to Nano X when the mock descriptor has no service UUID", () => {
    const { result } = renderHook(() => useMockBleDevicesScanning(true));

    emitBridgeMessage({
      type: "add",
      payload: {
        id: "mock_fallback",
        name: "Unknown mock device",
      },
    });

    expect(result.current.scannedDevices).toMatchObject([
      {
        deviceId: "mock_fallback",
        deviceName: "Unknown mock device",
        modelId: DeviceModelId.nanoX,
        wired: false,
      },
    ]);
  });

  it("should clear retained scanned devices when a new BLE state is imported", () => {
    const knownDevice = createKnownDevice();
    const { result } = renderHook(() => useMockBleDevicesScanning(true));

    emitScannedBleDevice(knownDevice);

    expect(result.current.scannedDevices).toHaveLength(1);

    emitBridgeMessage({
      type: "importBle",
    });

    expect(result.current.scannedDevices).toEqual([]);
  });

  it("should not expose scanned devices when disabled", () => {
    const { result } = renderHook(() => useMockBleDevicesScanning(false));

    emitScannedBleDevice(createKnownDevice());

    expect(result.current.scannedDevices).toEqual([]);
    expect(result.current.isScanning).toBe(false);
  });
});
