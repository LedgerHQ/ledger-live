import { renderHook } from "@testing-library/react";
import { type Mock } from "vitest";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { activeDeviceSessionSubject } from "../config/activeDeviceSession";
import { useDisableDeviceSessionRefresher } from "./useDisableDeviceSessionRefresher";

describe("useDisableDeviceSessionRefresher", () => {
  let deviceManagementKitMock: {
    getDeviceSessionState: Mock;
    disableDeviceSessionRefresher: Mock;
  };

  beforeEach(() => {
    deviceManagementKitMock = {
      getDeviceSessionState: vi.fn(),
      disableDeviceSessionRefresher: vi.fn().mockImplementation(() => {
        return () => {
          // cleanup function
        };
      }),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    activeDeviceSessionSubject.next(null);
  });

  describe("dmk is enabled", () => {
    it("should not disable the device session refresher if there is no active session", () => {
      renderHook(() =>
        useDisableDeviceSessionRefresher(deviceManagementKitMock as unknown as DeviceManagementKit),
      );
      expect(deviceManagementKitMock.disableDeviceSessionRefresher).not.toHaveBeenCalled();
    });

    it("should disable the device session refresher on the current active session", async () => {
      renderHook(() =>
        useDisableDeviceSessionRefresher(deviceManagementKitMock as unknown as DeviceManagementKit),
      );

      activeDeviceSessionSubject.next({
        sessionId: "valid-session",
        // @ts-expect-error yolo
        transport: {
          sessionId: "123",
        },
      });

      expect(deviceManagementKitMock.disableDeviceSessionRefresher).toHaveBeenCalledOnce();
    });

    it("should disable the next active session refresher", () => {
      renderHook(() =>
        useDisableDeviceSessionRefresher(deviceManagementKitMock as unknown as DeviceManagementKit),
      );

      activeDeviceSessionSubject.next({
        sessionId: "valid-session",
        // @ts-expect-error yolo
        transport: {
          sessionId: "123",
        },
      });

      activeDeviceSessionSubject.next({
        sessionId: "valid-session-2",
        // @ts-expect-error yolo
        transport: {
          sessionId: "456",
        },
      });

      expect(deviceManagementKitMock.disableDeviceSessionRefresher).toHaveBeenCalledTimes(2);
    });

    it("should not disable the session refresher if the session id is the same", () => {
      renderHook(() =>
        useDisableDeviceSessionRefresher(deviceManagementKitMock as unknown as DeviceManagementKit),
      );

      activeDeviceSessionSubject.next({
        sessionId: "valid-session",
        // @ts-expect-error yolo
        transport: {
          sessionId: "123",
        },
      });

      activeDeviceSessionSubject.next({
        sessionId: "valid-session",
        // @ts-expect-error yolo
        transport: {
          sessionId: "123",
        },
      });

      expect(deviceManagementKitMock.disableDeviceSessionRefresher).toHaveBeenCalledOnce();
    });

    describe("clean up function", () => {
      it("should be defined", () => {
        activeDeviceSessionSubject.next({
          sessionId: "valid-session",
          // @ts-expect-error yolo
          transport: {
            sessionId: "123",
          },
        });

        const { result } = renderHook(() =>
          useDisableDeviceSessionRefresher(
            deviceManagementKitMock as unknown as DeviceManagementKit,
          ),
        );

        expect(result.current.current).toBeDefined();
      });
    });
  });

  describe("dmk is null", () => {
    it("should not disable the device session refresher if there is no active session", () => {
      renderHook(() => useDisableDeviceSessionRefresher(null));
      expect(deviceManagementKitMock.disableDeviceSessionRefresher).not.toHaveBeenCalled();
    });

    it("should not disable the device session refresher even if there is an active session", () => {
      activeDeviceSessionSubject.next({
        sessionId: "valid-session-1",
        // @ts-expect-error yolo
        transport: {
          sessionId: "123",
        },
      });

      renderHook(() => useDisableDeviceSessionRefresher(null));
      expect(deviceManagementKitMock.disableDeviceSessionRefresher).not.toHaveBeenCalled();
    });
  });
});
