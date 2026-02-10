import { renderHook, act } from "@testing-library/react-native";
import { useInstallingContentViewModel } from "./useInstallingContentViewModel";
import { useAppDeviceAction } from "~/hooks/deviceActions";
import { getDeviceModel } from "@ledgerhq/devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { AppInstallConfig } from "../../constants/appInstallMap";

jest.mock("~/hooks/deviceActions");
jest.mock("@ledgerhq/devices", () => ({
  ...jest.requireActual("@ledgerhq/devices"),
  getDeviceModel: jest.fn(),
}));

const mockGetDeviceModel = getDeviceModel as jest.MockedFunction<typeof getDeviceModel>;
const mockUseAppDeviceAction = useAppDeviceAction as jest.MockedFunction<
  typeof useAppDeviceAction
>;

const mockDevice: Device = {
  deviceId: "test-device-id",
  modelId: "nanoX" as Device["modelId"],
  wired: false,
};

const mockAppConfig: AppInstallConfig = {
  appName: "Bitcoin",
  displayName: "Bitcoin",
  analyticsName: "bitcoin",
};

function setupMockAction(statusOverrides: Record<string, unknown> = {}) {
  const mockUseHook = jest.fn().mockReturnValue({
    allowManagerRequested: false,
    listingApps: false,
    error: null,
    progress: undefined,
    opened: false,
    ...statusOverrides,
  });

  mockUseAppDeviceAction.mockReturnValue({
    useHook: mockUseHook,
  } as unknown as ReturnType<typeof useAppDeviceAction>);

  return mockUseHook;
}

describe("useInstallingContentViewModel", () => {
  const defaultParams = {
    device: mockDevice,
    appConfig: mockAppConfig,
    onSuccess: jest.fn(),
    onError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetDeviceModel.mockReturnValue({
      productName: "Nano X",
    } as ReturnType<typeof getDeviceModel>);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("initial state", () => {
    it("should return default state when device action is idle", () => {
      setupMockAction();

      const { result } = renderHook(() => useInstallingContentViewModel(defaultParams));

      expect(result.current.showAllowManager).toBe(false);
      expect(result.current.listingApps).toBe(false);
      expect(result.current.progress).toBeUndefined();
      expect(result.current.productName).toBe("Nano X");
    });

    it("should build the correct command request from appConfig", () => {
      const mockUseHook = setupMockAction();

      renderHook(() => useInstallingContentViewModel(defaultParams));

      expect(mockUseHook).toHaveBeenCalledWith(mockDevice, {
        dependencies: [{ appName: "Bitcoin" }],
        appName: "BOLOS",
        withInlineInstallProgress: true,
        allowPartialDependencies: true,
      });
    });
  });

  describe("productName", () => {
    it("should return empty string when device model is not found", () => {
      setupMockAction();
      mockGetDeviceModel.mockReturnValue(undefined as unknown as ReturnType<typeof getDeviceModel>);

      const { result } = renderHook(() => useInstallingContentViewModel(defaultParams));

      expect(result.current.productName).toBe("");
    });
  });

  describe("allowManager flow", () => {
    it("should show allowManager after 300ms delay when requested", () => {
      setupMockAction({ allowManagerRequested: true });

      const { result } = renderHook(() => useInstallingContentViewModel(defaultParams));

      expect(result.current.showAllowManager).toBe(false);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current.showAllowManager).toBe(true);
    });

    it("should not show allowManager before 300ms delay", () => {
      setupMockAction({ allowManagerRequested: true });

      const { result } = renderHook(() => useInstallingContentViewModel(defaultParams));

      jest.advanceTimersByTime(299);

      expect(result.current.showAllowManager).toBe(false);
    });

    it("should hide allowManager when request is withdrawn", () => {
      const mockUseHook = jest.fn().mockReturnValue({
        allowManagerRequested: true,
        listingApps: false,
        error: null,
        progress: undefined,
        opened: false,
      });

      mockUseAppDeviceAction.mockReturnValue({
        useHook: mockUseHook,
      } as unknown as ReturnType<typeof useAppDeviceAction>);

      const { result, rerender } = renderHook(() => useInstallingContentViewModel(defaultParams));

      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(result.current.showAllowManager).toBe(true);

      // Simulate allowManagerRequested becoming false
      mockUseHook.mockReturnValue({
        allowManagerRequested: false,
        listingApps: false,
        error: null,
        progress: undefined,
        opened: false,
      });

      rerender(defaultParams);

      expect(result.current.showAllowManager).toBe(false);
    });

    it("should cancel pending timer when allowManagerRequested becomes false before timeout", () => {
      const mockUseHook = jest.fn().mockReturnValue({
        allowManagerRequested: true,
        listingApps: false,
        error: null,
        progress: undefined,
        opened: false,
      });

      mockUseAppDeviceAction.mockReturnValue({
        useHook: mockUseHook,
      } as unknown as ReturnType<typeof useAppDeviceAction>);

      const { result, rerender } = renderHook(() => useInstallingContentViewModel(defaultParams));

      // Advance only 100ms (timer not yet fired)
      jest.advanceTimersByTime(100);

      // Now withdraw the request
      mockUseHook.mockReturnValue({
        allowManagerRequested: false,
        listingApps: false,
        error: null,
        progress: undefined,
        opened: false,
      });

      rerender(defaultParams);

      // Advance past the original 300ms -- should NOT show allow manager
      jest.advanceTimersByTime(300);

      expect(result.current.showAllowManager).toBe(false);
    });
  });

  describe("listingApps", () => {
    it("should return listingApps true when action is listing apps", () => {
      setupMockAction({ listingApps: true });

      const { result } = renderHook(() => useInstallingContentViewModel(defaultParams));

      expect(result.current.listingApps).toBe(true);
    });
  });

  describe("progress", () => {
    it("should return progress value from device action", () => {
      setupMockAction({ progress: 0.5 });

      const { result } = renderHook(() => useInstallingContentViewModel(defaultParams));

      expect(result.current.progress).toBe(0.5);
    });

    it("should return progress 1 when install is complete", () => {
      setupMockAction({ progress: 1 });

      const { result } = renderHook(() => useInstallingContentViewModel(defaultParams));

      expect(result.current.progress).toBe(1);
    });
  });

  describe("onSuccess callback", () => {
    it("should call onSuccess when opened becomes true", () => {
      const onSuccess = jest.fn();
      setupMockAction({ opened: true });

      renderHook(() =>
        useInstallingContentViewModel({ ...defaultParams, onSuccess }),
      );

      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("should call onSuccess only once even if rerendered", () => {
      const onSuccess = jest.fn();
      setupMockAction({ opened: true });

      const { rerender } = renderHook(() =>
        useInstallingContentViewModel({ ...defaultParams, onSuccess }),
      );

      rerender({ ...defaultParams, onSuccess });
      rerender({ ...defaultParams, onSuccess });

      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("should not call onSuccess when opened is false", () => {
      const onSuccess = jest.fn();
      setupMockAction({ opened: false });

      renderHook(() =>
        useInstallingContentViewModel({ ...defaultParams, onSuccess }),
      );

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe("onError callback", () => {
    it("should call onError when an error occurs", () => {
      const onError = jest.fn();
      const testError = new Error("Installation failed");
      setupMockAction({ error: testError });

      renderHook(() =>
        useInstallingContentViewModel({ ...defaultParams, onError }),
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(testError);
    });

    it("should call onError only once even if rerendered", () => {
      const onError = jest.fn();
      const testError = new Error("Installation failed");
      setupMockAction({ error: testError });

      const { rerender } = renderHook(() =>
        useInstallingContentViewModel({ ...defaultParams, onError }),
      );

      rerender({ ...defaultParams, onError });
      rerender({ ...defaultParams, onError });

      expect(onError).toHaveBeenCalledTimes(1);
    });

    it("should not call onError when there is no error", () => {
      const onError = jest.fn();
      setupMockAction({ error: null });

      renderHook(() =>
        useInstallingContentViewModel({ ...defaultParams, onError }),
      );

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe("null status handling", () => {
    it("should handle null status gracefully", () => {
      mockUseAppDeviceAction.mockReturnValue({
        useHook: jest.fn().mockReturnValue(null),
      } as unknown as ReturnType<typeof useAppDeviceAction>);

      const { result } = renderHook(() => useInstallingContentViewModel(defaultParams));

      expect(result.current.showAllowManager).toBe(false);
      expect(result.current.listingApps).toBe(false);
      expect(result.current.progress).toBeUndefined();
    });
  });
});
