import { renderHook } from "@testing-library/react";
import { type Mock } from "vitest";
import { activeDeviceSessionSubject } from "../config/activeDeviceSession";
import { useDeviceManagementKit } from "./useDeviceManagementKit";
import { useDeviceSessionRefresherToggle } from "./useDeviceSessionRefresherToggle";

vi.mock("@ledgerhq/device-management-kit", async importOriginal => {
  const actual = await importOriginal<typeof import("@ledgerhq/device-management-kit")>();
  return {
    ...actual,
    DeviceManagementKitBuilder: vi.fn(() => ({
      addLogger: vi.fn().mockReturnThis(),
      addTransport: vi.fn().mockReturnThis(),
      build: vi.fn().mockReturnValue({
        getDeviceSessionState: vi.fn(),
        startDiscovering: vi.fn(),
        connect: vi.fn(),
        toggleDeviceSessionRefresher: vi.fn(),
      }),
    })),
    ConsoleLogger: vi.fn(),
    LogLevel: { Debug: "debug" },
    DeviceStatus: {
      NOT_CONNECTED: "not_connected",
      CONNECTED: "connected",
    },
  };
});

vi.mock("./useDeviceManagementKit", async importOriginal => {
  const actual = await importOriginal<typeof import("./useDeviceManagementKit")>();
  return {
    ...actual,
    useDeviceManagementKit: vi.fn(),
  };
});

describe("useDeviceSessionRefresherToggle", () => {
  let deviceManagementKitMock: {
    getDeviceSessionState: Mock;
    toggleDeviceSessionRefresher: Mock;
  };

  beforeEach(() => {
    deviceManagementKitMock = {
      getDeviceSessionState: vi.fn(),
      toggleDeviceSessionRefresher: vi.fn(),
    };
    (useDeviceManagementKit as Mock).mockReturnValue(deviceManagementKitMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("enabled = true", () => {
    it("should not toggle the device session refresher off if there is no active session", () => {
      renderHook(() => useDeviceSessionRefresherToggle(true));
      expect(deviceManagementKitMock.toggleDeviceSessionRefresher).not.toHaveBeenCalled();
    });

    it("should toggle the device session refresher off on the current active session", async () => {
      activeDeviceSessionSubject.next({
        sessionId: "valid-session",
        // @ts-expect-error yolo
        transport: {
          sessionId: "123",
        },
      });

      renderHook(() => useDeviceSessionRefresherToggle(true));

      expect(deviceManagementKitMock.toggleDeviceSessionRefresher).toHaveBeenCalledOnce();
    });

    it("should turn off the device session refresher on the new active session and turn it on for the previous active one", async () => {
      activeDeviceSessionSubject.next({
        sessionId: "valid-session-1",
        // @ts-expect-error yolo
        transport: {
          sessionId: "123",
        },
      });

      const { rerender } = renderHook(() => useDeviceSessionRefresherToggle(true));

      expect(deviceManagementKitMock.toggleDeviceSessionRefresher).toHaveBeenCalledWith({
        sessionId: "valid-session-1",
        enabled: false,
      });

      activeDeviceSessionSubject.next({
        sessionId: "valid-session-2",
        // @ts-expect-error yolo
        transport: {
          sessionId: "456",
        },
      });

      rerender();

      expect(deviceManagementKitMock.toggleDeviceSessionRefresher).toHaveBeenCalledWith({
        sessionId: "valid-session-1",
        enabled: true,
      });

      expect(deviceManagementKitMock.toggleDeviceSessionRefresher).toHaveBeenCalledWith({
        sessionId: "valid-session-2",
        enabled: false,
      });

      expect(deviceManagementKitMock.toggleDeviceSessionRefresher).toHaveBeenCalledTimes(3);
    });

    it("should reset the current device session refresher state when the hook is unmounted", () => {
      activeDeviceSessionSubject.next({
        sessionId: "valid-session-1",
        // @ts-expect-error yolo
        transport: {
          sessionId: "123",
        },
      });

      const { unmount } = renderHook(() => useDeviceSessionRefresherToggle(true));

      expect(deviceManagementKitMock.toggleDeviceSessionRefresher).toHaveBeenCalledWith({
        sessionId: "valid-session-1",
        enabled: false,
      });

      unmount();

      expect(deviceManagementKitMock.toggleDeviceSessionRefresher).toHaveBeenCalledWith({
        sessionId: "valid-session-1",
        enabled: true,
      });

      expect(deviceManagementKitMock.toggleDeviceSessionRefresher).toHaveBeenCalledTimes(2);
    });

    it("should do nothing if the hook is unmounted and there is no active session", () => {
      activeDeviceSessionSubject.next(null);
      const { unmount } = renderHook(() => useDeviceSessionRefresherToggle(true));
      unmount();
      expect(deviceManagementKitMock.toggleDeviceSessionRefresher).not.toHaveBeenCalled();
    });

    describe("resetRefresherState", () => {
      it("should be defined", () => {
        const { result } = renderHook(() => useDeviceSessionRefresherToggle(true));
        expect(result.current.resetRefresherState).toBeDefined();
      });

      it("should not unsubscribe if there is no active device session", () => {
        const { result } = renderHook(() => useDeviceSessionRefresherToggle(true));
        result.current.resetRefresherState();
        expect(deviceManagementKitMock.toggleDeviceSessionRefresher).not.toHaveBeenCalled();
      });

      it("should unsubscribe if there is an active device session", () => {
        activeDeviceSessionSubject.next({
          sessionId: "valid-session-1",
          // @ts-expect-error yolo
          transport: {
            sessionId: "123",
          },
        });

        const { result } = renderHook(() => useDeviceSessionRefresherToggle(true));
        result.current.resetRefresherState();
        expect(deviceManagementKitMock.toggleDeviceSessionRefresher).toHaveBeenCalledWith({
          sessionId: "valid-session-1",
          enabled: true,
        });
      });
    });
  });

  describe("enabled = false", () => {
    it("should not toggle the device session refresher on if there is no active session", () => {
      renderHook(() => useDeviceSessionRefresherToggle(false));
      expect(deviceManagementKitMock.toggleDeviceSessionRefresher).not.toHaveBeenCalled();
    });

    it("should not toggle the device session refresher on even if there is an active session", () => {
      activeDeviceSessionSubject.next({
        sessionId: "valid-session-1",
        // @ts-expect-error yolo
        transport: {
          sessionId: "123",
        },
      });

      renderHook(() => useDeviceSessionRefresherToggle(false));
      expect(deviceManagementKitMock.toggleDeviceSessionRefresher).not.toHaveBeenCalled();
    });

    it("should not do anything on unmount", () => {
      activeDeviceSessionSubject.next({
        sessionId: "valid-session-1",
        // @ts-expect-error yolo
        transport: {
          sessionId: "123",
        },
      });

      const { unmount } = renderHook(() => useDeviceSessionRefresherToggle(false));
      unmount();
      expect(deviceManagementKitMock.toggleDeviceSessionRefresher).not.toHaveBeenCalled();
    });
  });
});
