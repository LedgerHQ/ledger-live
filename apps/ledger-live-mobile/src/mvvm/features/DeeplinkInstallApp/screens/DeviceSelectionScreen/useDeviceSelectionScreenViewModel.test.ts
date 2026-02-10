import { act } from "@testing-library/react-native";
import { renderHook } from "@tests/test-renderer";
import { useDeviceSelectionScreenViewModel } from "./useDeviceSelectionScreenViewModel";
import { openDeeplinkInstallAppDrawer, setSelectedDevice } from "~/reducers/deeplinkInstallApp";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";

const TEST_APP_MAP: Record<string, object> = {
  Bitcoin: { appName: "Bitcoin", displayName: "Bitcoin", analyticsName: "bitcoin" },
};

jest.mock("../../constants/appInstallMap", () => ({
  getAppInstallConfig: (appKey: string) => TEST_APP_MAP[appKey] ?? null,
  isValidInstallApp: (appKey: string) => appKey in TEST_APP_MAP,
}));

const mockGoBack = jest.fn();
const mockSetOptions = jest.fn();
const mockNavigate = jest.fn();
const mockDispatch = jest.fn();

let mockIsFocused = true;
let mockRouteParams: Record<string, string> = { appKey: "Bitcoin" };

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => mockIsFocused,
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: mockNavigate,
    setOptions: mockSetOptions,
  }),
  useRoute: () => ({
    params: mockRouteParams,
  }),
}));

jest.mock("~/context/hooks", () => ({
  ...jest.requireActual("~/context/hooks"),
  useDispatch: () => mockDispatch,
}));

const mockDevice: Device = {
  deviceId: "test-device-id",
  modelId: "nanoX" as Device["modelId"],
  wired: false,
};

describe("useDeviceSelectionScreenViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFocused = true;
    mockRouteParams = { appKey: "Bitcoin" };
  });

  describe("appConfig resolution", () => {
    it("should resolve appConfig from a valid appKey route param", () => {
      const { result } = renderHook(() => useDeviceSelectionScreenViewModel());

      expect(result.current.appConfig).toEqual({
        appName: "Bitcoin",
        displayName: "Bitcoin",
        analyticsName: "bitcoin",
      });
    });

    it("should return null appConfig for an invalid appKey", () => {
      mockRouteParams = { appKey: "NonExistentApp" };

      const { result } = renderHook(() => useDeviceSelectionScreenViewModel());

      expect(result.current.appConfig).toBeNull();
    });

    it("should return null appConfig when appKey is missing", () => {
      mockRouteParams = {};

      const { result } = renderHook(() => useDeviceSelectionScreenViewModel());

      expect(result.current.appConfig).toBeNull();
    });
  });

  describe("navigation guard", () => {
    it("should call goBack when appConfig is null", () => {
      mockRouteParams = { appKey: "InvalidApp" };

      renderHook(() => useDeviceSelectionScreenViewModel());

      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });

    it("should not call goBack when appConfig is valid", () => {
      renderHook(() => useDeviceSelectionScreenViewModel());

      expect(mockGoBack).not.toHaveBeenCalled();
    });
  });

  describe("isFocused", () => {
    it("should reflect the focused state from navigation", () => {
      const { result } = renderHook(() => useDeviceSelectionScreenViewModel());

      expect(result.current.isFocused).toBe(true);
    });

    it("should return false when screen is not focused", () => {
      mockIsFocused = false;

      const { result } = renderHook(() => useDeviceSelectionScreenViewModel());

      expect(result.current.isFocused).toBe(false);
    });
  });

  describe("handleClose", () => {
    it("should call navigation.goBack", () => {
      const { result } = renderHook(() => useDeviceSelectionScreenViewModel());
      mockGoBack.mockClear();

      act(() => result.current.handleClose());

      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });
  });

  describe("onSelectDevice", () => {
    it("should dispatch setSelectedDevice, goBack, and openDeeplinkInstallAppDrawer", () => {
      const { result } = renderHook(() => useDeviceSelectionScreenViewModel());
      mockDispatch.mockClear();
      mockGoBack.mockClear();

      act(() => result.current.onSelectDevice(mockDevice));

      expect(mockDispatch).toHaveBeenCalledTimes(2);
      expect(mockDispatch).toHaveBeenCalledWith(setSelectedDevice(mockDevice));
      expect(mockDispatch).toHaveBeenCalledWith(
        openDeeplinkInstallAppDrawer({ appToInstall: "Bitcoin" }),
      );
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });

    it("should not dispatch when device is undefined", () => {
      const { result } = renderHook(() => useDeviceSelectionScreenViewModel());
      mockDispatch.mockClear();
      mockGoBack.mockClear();

      act(() => result.current.onSelectDevice(undefined));

      expect(mockDispatch).not.toHaveBeenCalled();
      expect(mockGoBack).not.toHaveBeenCalled();
    });

    it("should not dispatch when appKey is missing", () => {
      mockRouteParams = {};

      const { result } = renderHook(() => useDeviceSelectionScreenViewModel());
      mockGoBack.mockClear();
      mockDispatch.mockClear();

      act(() => result.current.onSelectDevice(mockDevice));

      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe("requestToSetHeaderOptions", () => {
    it("should set header options and mark header as overridden for 'set' type", () => {
      const mockHeaderLeft = jest.fn();
      const mockHeaderRight = jest.fn();

      const { result } = renderHook(() => useDeviceSelectionScreenViewModel());

      expect(result.current.isHeaderOverridden).toBe(false);

      act(() =>
        result.current.requestToSetHeaderOptions({
          type: "set",
          options: {
            headerLeft: mockHeaderLeft,
            headerRight: mockHeaderRight,
          },
        }),
      );

      expect(mockSetOptions).toHaveBeenCalledWith({
        headerShown: true,
        headerLeft: mockHeaderLeft,
        headerRight: mockHeaderRight,
        title: "",
      });
      expect(result.current.isHeaderOverridden).toBe(true);
    });

    it("should reset header options and mark header as not overridden for 'clean' type", () => {
      const { result } = renderHook(() => useDeviceSelectionScreenViewModel());

      act(() =>
        result.current.requestToSetHeaderOptions({
          type: "set",
          options: { headerLeft: jest.fn(), headerRight: jest.fn() },
        }),
      );

      expect(result.current.isHeaderOverridden).toBe(true);

      act(() =>
        result.current.requestToSetHeaderOptions({
          type: "clean",
        }),
      );

      expect(mockSetOptions).toHaveBeenLastCalledWith({
        headerShown: false,
        headerLeft: expect.any(Function),
        headerRight: expect.any(Function),
      });
      expect(result.current.isHeaderOverridden).toBe(false);
    });
  });

  describe("isHeaderOverridden", () => {
    it("should start as false", () => {
      const { result } = renderHook(() => useDeviceSelectionScreenViewModel());

      expect(result.current.isHeaderOverridden).toBe(false);
    });
  });
});
