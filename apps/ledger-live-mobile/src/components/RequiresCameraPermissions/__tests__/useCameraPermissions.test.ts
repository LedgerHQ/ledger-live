import { renderHook, act, waitFor } from "@tests/test-renderer";
import { AppState, Linking, AppStateStatus } from "react-native";
import { useCameraPermission, Camera } from "react-native-vision-camera";
import useCameraPermissions from "../useCameraPermissions";

let appStateCallback: ((state: AppStateStatus) => void) | null = null;
const mockRemove = jest.fn();

jest.mock("@ledgerhq/live-common/hooks/useIsMounted", () => ({
  __esModule: true,
  default: jest.fn(() => () => true),
}));

describe("useCameraPermissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    appStateCallback = null;
    Object.defineProperty(AppState, "currentState", {
      value: "active",
      configurable: true,
      writable: true,
    });
    jest.spyOn(AppState, "addEventListener").mockImplementation((_event, callback) => {
      appStateCallback = callback;
      return { remove: mockRemove };
    });
    jest.spyOn(Linking, "openSettings").mockResolvedValue();
    jest.mocked(useCameraPermission).mockReturnValue({
      hasPermission: true,
      requestPermission: jest.fn(() => Promise.resolve(true)),
    });
    jest.mocked(Camera.getCameraPermissionStatus).mockReturnValue("granted");
  });

  it("should request permission on mount", async () => {
    const { result } = renderHook(() => useCameraPermissions());

    await waitFor(() => {
      expect(result.current.firstAutomaticRequestCompleted).toBe(true);
    });
  });

  it("should return permission state", async () => {
    const { result } = renderHook(() => useCameraPermissions());

    await waitFor(() => {
      expect(result.current.permission).toBeDefined();
      expect(result.current.permission.granted).toBe(true);
    });
  });

  it("should provide contextValue with permissionGranted", async () => {
    const { result } = renderHook(() => useCameraPermissions());

    await waitFor(() => {
      expect(result.current.contextValue).toEqual({
        permissionGranted: true,
      });
    });
  });

  it("should open app settings when openAppSettings is called", async () => {
    const { result } = renderHook(() => useCameraPermissions());

    await waitFor(() => {
      expect(result.current.firstAutomaticRequestCompleted).toBe(true);
    });

    act(() => {
      result.current.openAppSettings();
    });

    expect(Linking.openSettings).toHaveBeenCalled();
  });

  it("should check permission when checkPermission is called", async () => {
    const { result } = renderHook(() => useCameraPermissions());

    await waitFor(() => {
      expect(result.current.firstAutomaticRequestCompleted).toBe(true);
    });

    await act(async () => {
      const status = await result.current.checkPermission();
      expect(status).toBe("granted");
    });
  });

  it("should handle denied permission status from checkPermission", async () => {
    jest.mocked(Camera.getCameraPermissionStatus).mockReturnValue("denied");

    const { result } = renderHook(() => useCameraPermissions());

    await waitFor(() => {
      expect(result.current.firstAutomaticRequestCompleted).toBe(true);
    });

    await act(async () => {
      await result.current.checkPermission();
    });

    expect(result.current.permission.granted).toBe(false);
    expect(result.current.permission.canAskAgain).toBe(false);
  });

  it("should handle not-determined permission status with canAskAgain true", async () => {
    jest.mocked(Camera.getCameraPermissionStatus).mockReturnValue("not-determined");

    const { result } = renderHook(() => useCameraPermissions());

    await waitFor(() => {
      expect(result.current.firstAutomaticRequestCompleted).toBe(true);
    });

    await act(async () => {
      await result.current.checkPermission();
    });

    expect(result.current.permission.granted).toBe(false);
    expect(result.current.permission.canAskAgain).toBe(true);
  });

  it("should handle permission denied on request", async () => {
    jest.mocked(useCameraPermission).mockReturnValue({
      hasPermission: false,
      requestPermission: jest.fn(() => Promise.resolve(false)),
    });

    const { result } = renderHook(() => useCameraPermissions());

    await waitFor(() => {
      expect(result.current.firstAutomaticRequestCompleted).toBe(true);
    });

    expect(result.current.permission.granted).toBe(false);
  });

  it("should check permission when app resumes from background after opening settings", async () => {
    const { result } = renderHook(() => useCameraPermissions());

    await waitFor(() => {
      expect(result.current.firstAutomaticRequestCompleted).toBe(true);
    });

    act(() => {
      result.current.openAppSettings();
    });

    expect(appStateCallback).toBeDefined();

    Object.defineProperty(AppState, "currentState", {
      value: "background",
      configurable: true,
      writable: true,
    });
    act(() => {
      appStateCallback?.("background");
    });

    jest.mocked(Camera.getCameraPermissionStatus).mockClear();
    jest.mocked(Camera.getCameraPermissionStatus).mockReturnValue("granted");

    await act(async () => {
      appStateCallback?.("active");
    });

    expect(jest.mocked(Camera.getCameraPermissionStatus)).toHaveBeenCalled();
  });

  it("should NOT check permission on resume if settings were not opened", async () => {
    renderHook(() => useCameraPermissions());

    await waitFor(() => {
      expect(appStateCallback).toBeDefined();
    });

    jest.mocked(Camera.getCameraPermissionStatus).mockClear();

    Object.defineProperty(AppState, "currentState", {
      value: "background",
      configurable: true,
      writable: true,
    });
    act(() => {
      appStateCallback?.("background");
    });

    await act(async () => {
      appStateCallback?.("active");
    });

    expect(jest.mocked(Camera.getCameraPermissionStatus)).not.toHaveBeenCalled();
  });

  it("should cleanup subscription on unmount", async () => {
    const { unmount } = renderHook(() => useCameraPermissions());

    await waitFor(() => {
      expect(AppState.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    });

    unmount();

    expect(mockRemove).toHaveBeenCalled();
  });

  it("should use hasPermission fallback when permissionStatus is null initially", () => {
    jest.mocked(useCameraPermission).mockReturnValue({
      hasPermission: false,
      requestPermission: jest.fn(() => new Promise(() => {})),
    });

    const { result } = renderHook(() => useCameraPermissions());

    expect(result.current.permission.granted).toBe(false);
    expect(result.current.permission.canAskAgain).toBe(true);
  });

  it("should return contextValue with null permissionGranted when permission is false", async () => {
    jest.mocked(useCameraPermission).mockReturnValue({
      hasPermission: false,
      requestPermission: jest.fn(() => Promise.resolve(false)),
    });

    const { result } = renderHook(() => useCameraPermissions());

    await waitFor(() => {
      expect(result.current.firstAutomaticRequestCompleted).toBe(true);
    });

    expect(result.current.contextValue.permissionGranted).toBe(false);
  });

  it("should return all expected properties from the hook", async () => {
    const { result } = renderHook(() => useCameraPermissions());

    await waitFor(() => {
      expect(result.current.firstAutomaticRequestCompleted).toBe(true);
    });

    expect(result.current).toHaveProperty("permission");
    expect(result.current).toHaveProperty("requestPermission");
    expect(result.current).toHaveProperty("checkPermission");
    expect(result.current).toHaveProperty("firstAutomaticRequestCompleted");
    expect(result.current).toHaveProperty("openAppSettings");
    expect(result.current).toHaveProperty("contextValue");
  });
});
