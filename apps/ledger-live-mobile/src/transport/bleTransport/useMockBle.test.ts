import { act, renderHook } from "@testing-library/react-native";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { useMockBleDevicesScanning } from "./useMockBle";

const mockListen = jest.fn();
const mockOpen = jest.fn();
const mockUseSelector = jest.fn();

jest.mock("./index", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    listen: mockListen,
    open: mockOpen,
  })),
}));

jest.mock("~/context/hooks", () => ({
  useSelector: (...args: unknown[]) => mockUseSelector(...args),
}));

type MockBleEvent = {
  type: "add";
  descriptor: {
    id: string;
    name: string;
    serviceUUID: string;
  };
};

const createKnownDevice = (overrides: Partial<{ id: string; name: string; modelId: DeviceModelId }> = {}) => ({
  id: "mock_1",
  name: "Nano X",
  modelId: DeviceModelId.nanoX,
  ...overrides,
});

const getServiceUuid = (modelId: DeviceModelId) => {
  const serviceUuid = getDeviceModel(modelId).bluetoothSpec?.[0]?.serviceUuid;

  if (!serviceUuid) {
    throw new Error(`Missing bluetooth service UUID for ${modelId}`);
  }

  return serviceUuid;
};

describe("useMockBleDevicesScanning", () => {
  let knownDevices: ReturnType<typeof createKnownDevice>[];
  let bleListener: { next: (event: MockBleEvent) => void } | null;

  beforeEach(() => {
    knownDevices = [];
    bleListener = null;

    mockUseSelector.mockImplementation(() => knownDevices);
    mockListen.mockImplementation(listener => {
      bleListener = listener;
      return { unsubscribe: jest.fn() };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should expose remembered mock BLE devices as scanned devices when enabled", () => {
    knownDevices = [createKnownDevice()];

    const { result } = renderHook(() => useMockBleDevicesScanning(true));

    expect(result.current.scannedDevices).toMatchObject([
      {
        deviceId: "mock_1",
        deviceName: "Nano X",
        modelId: DeviceModelId.nanoX,
        wired: false,
        discoveredDevice: {
          id: "mock_1",
          name: "Nano X",
          transport: "BLE",
        },
      },
    ]);
  });

  it("should derive the scanned device model from the bluetooth service UUID", () => {
    const { result } = renderHook(() => useMockBleDevicesScanning(true));

    const listener = bleListener;

    if (!listener) {
      throw new Error("BLE listener was not registered");
    }

    act(() => {
      listener.next({
        type: "add",
        descriptor: {
          id: "mock_4",
          name: "Stax",
          serviceUUID: getServiceUuid(DeviceModelId.stax),
        },
      });
    });

    expect(result.current.scannedDevices).toMatchObject([
      {
        deviceId: "mock_4",
        deviceName: "Stax",
        modelId: DeviceModelId.stax,
        wired: false,
        discoveredDevice: {
          id: "mock_4",
          name: "Stax",
          transport: "BLE",
        },
      },
    ]);
  });

  it("should not expose scanned devices when disabled", () => {
    knownDevices = [createKnownDevice()];

    const { result } = renderHook(() => useMockBleDevicesScanning(false));

    expect(result.current.scannedDevices).toEqual([]);
    expect(result.current.isScanning).toBe(false);
  });
});
