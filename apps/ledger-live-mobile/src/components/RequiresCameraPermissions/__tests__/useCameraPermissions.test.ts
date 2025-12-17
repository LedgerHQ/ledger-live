import { renderHook, act, waitFor } from "@testing-library/react-native";
import { AppState, Linking } from "react-native";
import { useCameraPermission, Camera } from "react-native-vision-camera";
import useCameraPermissions from "../useCameraPermissions";

type AppStateCallback = (state: string) => void;
let appStateCallback: AppStateCallback | null = null;
const mockRemove = jest.fn();

jest.mock("react-native", () => ({
  AppState: {
    currentState: "active",
    addEventListener: jest.fn((event: string, callback: AppStateCallback) => {
      appStateCallback = callback;
      return { remove: mockRemove };
    }),
  },
  Linking: {
    openSettings: jest.fn(),
  },
}));

jest.mock("react-native-vision-camera", () => ({
  useCameraPermission: jest.fn(() => ({
    hasPermission: true,
    requestPermission: jest.fn(() => Promise.resolve(true)),
  })),
  Camera: {
    getCameraPermissionStatus: jest.fn(() => Promise.resolve("granted")),
  },
}));

jest.mock("@ledgerhq/live-common/hooks/useIsMounted", () => ({
  __esModule: true,
  default: jest.fn(() => () => true),
}));

describe("useCameraPermissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    appStateCallback = null;
    (AppState as unknown as { currentState: string }).currentState = "active";
    (useCameraPermission as jest.Mock).mockReturnValue({
      hasPermission: true,
      requestPermission: jest.fn(() => Promise.resolve(true)),
    });
    (Camera.getCameraPermissionStatus as jest.Mock).mockResolvedValue("granted");
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
    (Camera.getCameraPermissionStatus as jest.Mock).mockResolvedValue("denied");

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
    (Camera.getCameraPermissionStatus as jest.Mock).mockResolvedValue("not-determined");

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
    (useCameraPermission as jest.Mock).mockReturnValue({
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

    (AppState as unknown as { currentState: string }).currentState = "background";
    act(() => {
      appStateCallback?.("background");
    });

    (Camera.getCameraPermissionStatus as jest.Mock).mockClear();
    (Camera.getCameraPermissionStatus as jest.Mock).mockResolvedValue("granted");

    await act(async () => {
      appStateCallback?.("active");
    });

    expect(Camera.getCameraPermissionStatus).toHaveBeenCalled();
  });

  it("should NOT check permission on resume if settings were not opened", async () => {
    renderHook(() => useCameraPermissions());

    await waitFor(() => {
      expect(appStateCallback).toBeDefined();
    });

    (Camera.getCameraPermissionStatus as jest.Mock).mockClear();

    (AppState as unknown as { currentState: string }).currentState = "background";
    act(() => {
      appStateCallback?.("background");
    });

    await act(async () => {
      appStateCallback?.("active");
    });

    expect(Camera.getCameraPermissionStatus).not.toHaveBeenCalled();
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
    (useCameraPermission as jest.Mock).mockReturnValue({
      hasPermission: false,
      requestPermission: jest.fn(() => new Promise(() => {})),
    });

    const { result } = renderHook(() => useCameraPermissions());

    expect(result.current.permission.granted).toBe(false);
    expect(result.current.permission.canAskAgain).toBe(true);
  });

  it("should return contextValue with null permissionGranted when permission is false", async () => {
    (useCameraPermission as jest.Mock).mockReturnValue({
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
