import { Linking } from "react-native";
import { DeviceModelId } from "@ledgerhq/devices";
import { disconnect } from "@ledgerhq/live-common/hw/index";
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

describe("useDeviceSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      expect(Linking.openURL).toHaveBeenCalledWith(urls.hardwareWallet);
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "ExploreDevices",
        page: ScreenName.MyWallet,
      });
    });
  });

  describe("onOpenRemoveMenu", () => {
    it("should set selectedDevice and open the drawer", () => {
      const { result } = renderHook(() => useDeviceSectionViewModel());

      expect(result.current.selectedDevice).toBeNull();
      expect(result.current.isRemoveDrawerOpen).toBe(false);

      act(() => result.current.onOpenRemoveMenu(mockDevice));

      expect(result.current.selectedDevice).toEqual(mockDevice);
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
      expect(result.current.selectedDevice).toBeNull();
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

      expect(result.current.selectedDevice).toBeNull();
      expect(result.current.isRemoveDrawerOpen).toBe(false);
    });
  });
});
