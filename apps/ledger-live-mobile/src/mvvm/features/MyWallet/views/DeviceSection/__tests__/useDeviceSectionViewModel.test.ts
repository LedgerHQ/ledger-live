import { Linking } from "react-native";
import { DeviceModelId } from "@ledgerhq/devices";
import { BluetoothRequired } from "@ledgerhq/errors";
import { disconnect } from "@ledgerhq/live-common/hw/index";
import { findMatchingNewDevice } from "@ledgerhq/live-dmk-mobile";
import { act, renderHook } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { track } from "~/analytics";
import { urls } from "~/utils/urls";
import { useDeviceSectionViewModel, type DeviceSectionDevice } from "../useDeviceSectionViewModel";
import type { State } from "~/reducers/types";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("@ledgerhq/live-dmk-mobile", () => ({
  findMatchingNewDevice: jest.fn(() => null),
  useBleDevicesScanning: jest.fn(() => ({ scannedDevices: [] })),
}));

jest.mock("@ledgerhq/live-common/hw/index", () => ({
  disconnect: jest.fn(() => Promise.resolve()),
}));

const mockDevice: DeviceSectionDevice = {
  id: "device-1",
  name: "Flex Pro",
  modelId: DeviceModelId.europa,
  available: false,
};

const withKnownDevice = (state: State): State => ({
  ...state,
  ble: {
    ...state.ble,
    knownDevices: [{ id: "device-1", name: "Flex Pro", modelId: DeviceModelId.europa }],
  },
});

const withMultipleKnownDevices = (state: State): State => ({
  ...state,
  ble: {
    ...state.ble,
    knownDevices: [
      { id: "device-1", name: "Flex Pro", modelId: DeviceModelId.europa },
      { id: "device-2", name: "Nano X", modelId: DeviceModelId.nanoX },
    ],
  },
});

describe("useDeviceSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("devices", () => {
    it("should return an empty list when there are no known devices", () => {
      const { result } = renderHook(() => useDeviceSectionViewModel());

      expect(result.current.devices).toEqual([]);
      expect(result.current.hasDevices).toBe(false);
    });

    it("should map known devices in reverse order with available: false by default", () => {
      const { result } = renderHook(() => useDeviceSectionViewModel(), {
        overrideInitialState: withMultipleKnownDevices,
      });

      expect(result.current.devices).toEqual([
        { id: "device-2", name: "Nano X", modelId: DeviceModelId.nanoX, available: false },
        { id: "device-1", name: "Flex Pro", modelId: DeviceModelId.europa, available: false },
      ]);
      expect(result.current.hasDevices).toBe(true);
    });

    it("should set available to true when a scanned device matches", () => {
      jest.mocked(findMatchingNewDevice).mockReturnValue({} as never);

      const { result } = renderHook(() => useDeviceSectionViewModel(), {
        overrideInitialState: withKnownDevice,
      });

      expect(result.current.devices[0].available).toBe(true);
    });
  });

  describe("onAddDevice", () => {
    it("should navigate to BleDevicePairingFlow and track event", () => {
      const { result } = renderHook(() => useDeviceSectionViewModel());

      act(() => result.current.onAddDevice());

      expect(mockNavigate).toHaveBeenCalledWith(ScreenName.BleDevicePairingFlow);
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Add",
        page: ScreenName.MyWallet,
      });
    });
  });

  describe("onExploreDevices", () => {
    it("should open the hardware wallet shop URL and track event", () => {
      const { result } = renderHook(() => useDeviceSectionViewModel());

      act(() => result.current.onExploreDevices());

      expect(Linking.openURL).toHaveBeenCalledWith(urls.exploreLedgerDevices);
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "ExploreDevices",
        page: ScreenName.MyWallet,
      });
    });
  });

  describe("onDevicePress", () => {
    it("should set selectedDevice as a Device and track event", () => {
      const { result } = renderHook(() => useDeviceSectionViewModel());

      expect(result.current.selectedDevice).toBeNull();

      act(() => result.current.onDevicePress(mockDevice));

      expect(result.current.selectedDevice).toEqual({
        deviceId: "device-1",
        deviceName: "Flex Pro",
        modelId: DeviceModelId.europa,
        wired: false,
      });
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Device",
        page: ScreenName.MyWallet,
        deviceModelId: DeviceModelId.europa,
      });
    });
  });

  describe("onDeviceActionClose", () => {
    it("should clear selectedDevice", () => {
      const { result } = renderHook(() => useDeviceSectionViewModel());

      act(() => result.current.onDevicePress(mockDevice));
      expect(result.current.selectedDevice).not.toBeNull();

      act(() => result.current.onDeviceActionClose());

      expect(result.current.selectedDevice).toBeNull();
    });
  });

  describe("onDeviceActionError", () => {
    it("should clear selectedDevice on BluetoothRequired error", () => {
      const { result } = renderHook(() => useDeviceSectionViewModel());

      act(() => result.current.onDevicePress(mockDevice));
      expect(result.current.selectedDevice).not.toBeNull();

      act(() => result.current.onDeviceActionError(new BluetoothRequired()));

      expect(result.current.selectedDevice).toBeNull();
    });

    it("should not clear selectedDevice on other errors", () => {
      const { result } = renderHook(() => useDeviceSectionViewModel());

      act(() => result.current.onDevicePress(mockDevice));
      const deviceBefore = result.current.selectedDevice;

      act(() => result.current.onDeviceActionError(new Error("some error")));

      expect(result.current.selectedDevice).toEqual(deviceBefore);
    });
  });

  describe("onOpenRemoveMenu", () => {
    it("should set deviceToRemove and open the drawer", () => {
      const { result } = renderHook(() => useDeviceSectionViewModel());

      expect(result.current.deviceToRemove).toBeNull();
      expect(result.current.isRemoveDrawerOpen).toBe(false);

      act(() => result.current.onOpenRemoveMenu(mockDevice));

      expect(result.current.deviceToRemove).toEqual(mockDevice);
      expect(result.current.isRemoveDrawerOpen).toBe(true);
    });
  });

  describe("onCloseRemoveMenu", () => {
    it("should close the drawer", () => {
      const { result } = renderHook(() => useDeviceSectionViewModel());

      act(() => result.current.onOpenRemoveMenu(mockDevice));
      expect(result.current.isRemoveDrawerOpen).toBe(true);

      act(() => result.current.onCloseRemoveMenu());
      expect(result.current.isRemoveDrawerOpen).toBe(false);
    });
  });

  describe("onRemoveDevice", () => {
    it("should dispatch removeKnownDevice, disconnect, close drawer, and clear selection", async () => {
      const { result, store } = renderHook(() => useDeviceSectionViewModel(), {
        overrideInitialState: withKnownDevice,
      });

      act(() => result.current.onOpenRemoveMenu(mockDevice));

      await act(async () => {
        await result.current.onRemoveDevice();
      });

      expect(disconnect).toHaveBeenCalledWith("device-1");
      expect(result.current.isRemoveDrawerOpen).toBe(false);
      expect(result.current.deviceToRemove).toBeNull();
      expect(store.getState().ble.knownDevices).toEqual([]);
    });

    it("should do nothing when no device is selected", async () => {
      const { result } = renderHook(() => useDeviceSectionViewModel());

      await act(async () => {
        await result.current.onRemoveDevice();
      });

      expect(disconnect).not.toHaveBeenCalled();
    });

    it("should still clear selection when disconnect fails", async () => {
      jest.mocked(disconnect).mockRejectedValueOnce(new Error("BLE error"));

      const { result } = renderHook(() => useDeviceSectionViewModel(), {
        overrideInitialState: withKnownDevice,
      });

      act(() => result.current.onOpenRemoveMenu(mockDevice));

      await act(async () => {
        await result.current.onRemoveDevice();
      });

      expect(result.current.deviceToRemove).toBeNull();
      expect(result.current.isRemoveDrawerOpen).toBe(false);
    });
  });
});
