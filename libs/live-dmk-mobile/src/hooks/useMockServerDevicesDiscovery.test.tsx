import { renderHook, waitFor } from "@testing-library/react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  configureMockServerTransport,
  resetMockServerTransport,
} from "../mockServerTransportConfig";
import { listMockServerDevices, type MockServerDevice } from "@ledgerhq/live-dmk-shared";
import { useMockServerDevicesDiscovery } from "./useMockServerDevicesDiscovery";

jest.mock("@ledgerhq/live-dmk-shared", () => ({
  ...jest.requireActual("@ledgerhq/live-dmk-shared"),
  listMockServerDevices: jest.fn(),
}));

const listMockServerDevicesMock = jest.mocked(listMockServerDevices);

const staxOverBle: MockServerDevice = {
  id: "device-1",
  name: "My Stax",
  device_type: "stax",
  connectivity_type: "BLE",
};
const nanoXOverUsb: MockServerDevice = {
  id: "device-2",
  name: "My Nano X",
  device_type: "nanoX",
  connectivity_type: "USB",
};

describe("useMockServerDevicesDiscovery", () => {
  beforeEach(() => {
    listMockServerDevicesMock.mockReset();
  });

  afterEach(() => {
    resetMockServerTransport();
  });

  it("should list every session device with its compat id and connectivity when the transport is configured", async () => {
    configureMockServerTransport({ url: "https://mock.example", token: "token-1" });
    listMockServerDevicesMock.mockResolvedValue([staxOverBle, nanoXOverUsb]);

    const { result } = renderHook(() => useMockServerDevicesDiscovery(true));

    await waitFor(() => expect(result.current).toHaveLength(2));
    expect(listMockServerDevicesMock).toHaveBeenCalledWith({
      url: "https://mock.example",
      token: "token-1",
    });
    expect(
      result.current.map(({ deviceId, wired, modelId }) => ({ deviceId, wired, modelId })),
    ).toEqual([
      { deviceId: "mockserver|device-1", wired: false, modelId: DeviceModelId.stax },
      { deviceId: "mockserver|device-2", wired: true, modelId: DeviceModelId.nanoX },
    ]);
    expect(result.current[0].discoveredDevice).toMatchObject({
      id: "device-1",
      transport: "MOCKSERVER",
    });
  });

  it("should list nothing when the mock server transport is not configured", () => {
    const { result } = renderHook(() => useMockServerDevicesDiscovery(true));

    expect(result.current).toEqual([]);
    expect(listMockServerDevicesMock).not.toHaveBeenCalled();
  });
});
