import { Linking } from "react-native";
import { act, renderHook } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { track } from "~/analytics";
import { urls } from "~/utils/urls";
import { useDeviceSectionViewModel } from "../useDeviceSectionViewModel";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("@ledgerhq/live-dmk-mobile", () => ({
  findMatchingNewDevice: jest.fn(() => null),
  useBleDevicesScanning: jest.fn(() => ({ scannedDevices: [] })),
}));

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
});
