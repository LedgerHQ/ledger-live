import { renderHook } from "@testing-library/react";
import { type Mock } from "vitest";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { activeDeviceSessionSubject } from "../config/activeDeviceSession";
import { useDisableDeviceSessionRefresher } from "./useDeviceSessionRefresherToggle";

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
        disableDeviceSessionRefresher: vi.fn(),
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

describe("useDeviceSessionRefresherToggle", () => {
  let deviceManagementKitMock: {
    getDeviceSessionState: Mock;
    disableDeviceSessionRefresher: Mock;
  };

  beforeEach(() => {
    deviceManagementKitMock = {
      getDeviceSessionState: vi.fn(),
      disableDeviceSessionRefresher: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("enabled = true", () => {
    it("should not toggle the device session refresher off if there is no active session", () => {
      renderHook(() =>
        useDisableDeviceSessionRefresher(
          deviceManagementKitMock as unknown as DeviceManagementKit,
          true,
        ),
      );
      expect(deviceManagementKitMock.disableDeviceSessionRefresher).not.toHaveBeenCalled();
    });

    it("should toggle the device session refresher off on the current active session", async () => {
      activeDeviceSessionSubject.next({
        sessionId: "valid-session",
        // @ts-expect-error yolo
        transport: {
          sessionId: "123",
        },
      });

      renderHook(() =>
        useDisableDeviceSessionRefresher(
          deviceManagementKitMock as unknown as DeviceManagementKit,
          true,
        ),
      );

      expect(deviceManagementKitMock.disableDeviceSessionRefresher).toHaveBeenCalledOnce();
    });

    it("should turn off the device session refresher on the new active session and turn it on for the previous active one", async () => {
      activeDeviceSessionSubject.next({
        sessionId: "valid-session-1",
        // @ts-expect-error yolo
        transport: {
          sessionId: "123",
        },
      });

      const { rerender } = renderHook(() =>
        useDisableDeviceSessionRefresher(
          deviceManagementKitMock as unknown as DeviceManagementKit,
          true,
        ),
      );

      expect(deviceManagementKitMock.disableDeviceSessionRefresher).toHaveBeenCalledWith({
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

      expect(deviceManagementKitMock.disableDeviceSessionRefresher).toHaveBeenCalledWith({
        sessionId: "valid-session-1",
        enabled: true,
      });

      expect(deviceManagementKitMock.disableDeviceSessionRefresher).toHaveBeenCalledWith({
        sessionId: "valid-session-2",
        enabled: false,
      });

      expect(deviceManagementKitMock.disableDeviceSessionRefresher).toHaveBeenCalledTimes(3);
    });

    it("should reset the current device session refresher state when the hook is unmounted", () => {
      activeDeviceSessionSubject.next({
        sessionId: "valid-session-1",
        // @ts-expect-error yolo
        transport: {
          sessionId: "123",
        },
      });

      const { unmount } = renderHook(() =>
        useDisableDeviceSessionRefresher(
          deviceManagementKitMock as unknown as DeviceManagementKit,
          true,
        ),
      );

      expect(deviceManagementKitMock.disableDeviceSessionRefresher).toHaveBeenCalledWith({
        sessionId: "valid-session-1",
        enabled: false,
      });

      unmount();

      expect(deviceManagementKitMock.disableDeviceSessionRefresher).toHaveBeenCalledWith({
        sessionId: "valid-session-1",
        enabled: true,
      });

      expect(deviceManagementKitMock.disableDeviceSessionRefresher).toHaveBeenCalledTimes(2);
    });

    it("should do nothing if the hook is unmounted and there is no active session", () => {
      activeDeviceSessionSubject.next(null);
      const { unmount } = renderHook(() =>
        useDisableDeviceSessionRefresher(
          deviceManagementKitMock as unknown as DeviceManagementKit,
          true,
        ),
      );
      unmount();
      expect(deviceManagementKitMock.disableDeviceSessionRefresher).not.toHaveBeenCalled();
    });

    describe("resetRefresherState", () => {
      it("should be defined", () => {
        const { result } = renderHook(() =>
          useDisableDeviceSessionRefresher(
            deviceManagementKitMock as unknown as DeviceManagementKit,
            true,
          ),
        );
        expect(result.current).toBeDefined();
      });

      it("should not unsubscribe if there is no active device session", () => {
        const { result } = renderHook(() =>
          useDisableDeviceSessionRefresher(
            deviceManagementKitMock as unknown as DeviceManagementKit,
            true,
          ),
        );
        expect(result.current).not.toBeDefined();
        expect(deviceManagementKitMock.disableDeviceSessionRefresher).not.toHaveBeenCalled();
      });

      it("should unsubscribe if there is an active device session", () => {
        activeDeviceSessionSubject.next({
          sessionId: "valid-session-1",
          // @ts-expect-error yolo
          transport: {
            sessionId: "123",
          },
        });

        const { result } = renderHook(() =>
          useDisableDeviceSessionRefresher(
            deviceManagementKitMock as unknown as DeviceManagementKit,
            true,
          ),
        );
        result?.current?.();
        expect(deviceManagementKitMock.disableDeviceSessionRefresher).toHaveBeenCalledWith({
          sessionId: "valid-session-1",
          enabled: true,
        });
      });
    });
  });

  describe("enabled = false", () => {
    it("should not toggle the device session refresher on if there is no active session", () => {
      renderHook(() =>
        useDisableDeviceSessionRefresher(
          deviceManagementKitMock as unknown as DeviceManagementKit,
          false,
        ),
      );
      expect(deviceManagementKitMock.disableDeviceSessionRefresher).not.toHaveBeenCalled();
    });

    it("should not toggle the device session refresher on even if there is an active session", () => {
      activeDeviceSessionSubject.next({
        sessionId: "valid-session-1",
        // @ts-expect-error yolo
        transport: {
          sessionId: "123",
        },
      });

      renderHook(() =>
        useDisableDeviceSessionRefresher(
          deviceManagementKitMock as unknown as DeviceManagementKit,
          false,
        ),
      );
      expect(deviceManagementKitMock.disableDeviceSessionRefresher).not.toHaveBeenCalled();
    });

    it("should not do anything on unmount", () => {
      activeDeviceSessionSubject.next({
        sessionId: "valid-session-1",
        // @ts-expect-error yolo
        transport: {
          sessionId: "123",
        },
      });

      const { unmount } = renderHook(() =>
        useDisableDeviceSessionRefresher(
          deviceManagementKitMock as unknown as DeviceManagementKit,
          false,
        ),
      );
      unmount();
      expect(deviceManagementKitMock.disableDeviceSessionRefresher).not.toHaveBeenCalled();
    });
  });
});
