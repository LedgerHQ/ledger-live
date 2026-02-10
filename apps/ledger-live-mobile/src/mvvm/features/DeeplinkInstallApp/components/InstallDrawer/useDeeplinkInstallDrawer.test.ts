import { renderHook, act } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { useDeeplinkInstallDrawer } from "./useDeeplinkInstallDrawer";
import { ScreenName, NavigatorName } from "~/const";
import { track } from "~/analytics";

jest.mock("~/analytics", () => ({
  track: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

const mockDevice = {
  deviceId: "test-device-id",
  modelId: "nanoX",
  wired: false,
} as const;

describe("useDeeplinkInstallDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should return initial state when drawer is closed", () => {
      const { result } = renderHook(() => useDeeplinkInstallDrawer());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.step).toBe("confirmation");
      expect(result.current.device).toBeNull();
      expect(result.current.installError).toBeNull();
      expect(result.current.appConfig).toBeNull();
    });

    it("should return appConfig when drawer is open with valid app", () => {
      const { result } = renderHook(() => useDeeplinkInstallDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          deeplinkInstallApp: {
            isDrawerOpen: true,
            appToInstall: "Bitcoin",
            selectedDevice: null,
          },
        }),
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.appConfig).toEqual({
        appName: "Bitcoin",
        displayName: "Bitcoin",
        analyticsName: "bitcoin",
      });
    });
  });

  describe("handleClose", () => {
    it("should dispatch closeDeeplinkInstallAppDrawer and reset state", () => {
      const { result, store } = renderHook(() => useDeeplinkInstallDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          deeplinkInstallApp: {
            isDrawerOpen: true,
            appToInstall: "Bitcoin",
            selectedDevice: null,
          },
        }),
      });

      act(() => result.current.handleClose());

      expect(store.getState().deeplinkInstallApp.isDrawerOpen).toBe(false);
      expect(result.current.step).toBe("confirmation");
      expect(result.current.device).toBeNull();
    });
  });

  describe("handleConfirm", () => {
    it("should track button click and navigate to device selection", () => {
      const { result } = renderHook(() => useDeeplinkInstallDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          deeplinkInstallApp: {
            isDrawerOpen: true,
            appToInstall: "Bitcoin",
            selectedDevice: null,
          },
        }),
      });

      act(() => result.current.handleConfirm());

      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        expect.objectContaining({
          button: "Install Bitcoin",
          source: "Universal Link",
        }),
      );

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Base, {
        screen: ScreenName.DeeplinkInstallAppDeviceSelection,
        params: {
          appKey: "Bitcoin",
        },
      });
    });

    it("should not navigate when appToInstall is null", () => {
      const { result } = renderHook(() => useDeeplinkInstallDrawer());

      act(() => result.current.handleConfirm());

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("handleRetry", () => {
    it("should reset state and navigate to device selection", () => {
      const { result, store } = renderHook(() => useDeeplinkInstallDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          deeplinkInstallApp: {
            isDrawerOpen: true,
            appToInstall: "Bitcoin",
            selectedDevice: null,
          },
        }),
      });

      act(() => result.current.handleRetry());

      expect(store.getState().deeplinkInstallApp.isDrawerOpen).toBe(false);
      expect(result.current.step).toBe("confirmation");
      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Base, {
        screen: ScreenName.DeeplinkInstallAppDeviceSelection,
        params: {
          appKey: "Bitcoin",
        },
      });
    });
  });

  describe("handleInstallSuccess", () => {
    it("should set step to success", () => {
      const { result } = renderHook(() => useDeeplinkInstallDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          deeplinkInstallApp: {
            isDrawerOpen: true,
            appToInstall: "Bitcoin",
            selectedDevice: null,
          },
        }),
      });

      act(() => result.current.handleInstallSuccess());

      expect(result.current.step).toBe("success");
    });
  });

  describe("handleInstallError", () => {
    it("should set step to error and store error", () => {
      const { result } = renderHook(() => useDeeplinkInstallDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          deeplinkInstallApp: {
            isDrawerOpen: true,
            appToInstall: "Bitcoin",
            selectedDevice: null,
          },
        }),
      });

      const testError = new Error("Installation failed");

      act(() => result.current.handleInstallError(testError));

      expect(result.current.step).toBe("error");
      expect(result.current.installError).toBe(testError);
    });
  });

  describe("device selection flow", () => {
    it("should transition to installing step when device is selected via Redux", () => {
      const { result } = renderHook(() => useDeeplinkInstallDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          deeplinkInstallApp: {
            isDrawerOpen: true,
            appToInstall: "Bitcoin",
            selectedDevice: mockDevice,
          },
        }),
      });

      expect(result.current.step).toBe("installing");
      expect(result.current.device).toEqual(mockDevice);
    });

    it("should set installKey > 0 when device is selected for fresh hook remount", () => {
      const { result } = renderHook(() => useDeeplinkInstallDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          deeplinkInstallApp: {
            isDrawerOpen: true,
            appToInstall: "Bitcoin",
            selectedDevice: mockDevice,
          },
        }),
      });

      expect(result.current.installKey).toBeGreaterThan(0);
    });
  });
});
