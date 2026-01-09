import { firstValueFrom, Subject, take, throwError } from "rxjs";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import Transport, { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { DeviceModelId } from "@ledgerhq/devices/index";
import { SendApduTimeoutError } from "@ledgerhq/device-management-kit";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { isLockedDevicePolling, useIsDeviceLockedPolling } from "./useIsDeviceLockedPolling";
import { IsDeviceLockedResultType, IsDeviceLockedResult } from "./types";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";

jest.mock("@ledgerhq/live-common/hw/deviceAccess", () => ({
  withDevice: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockWithDevice = withDevice as jest.Mock<any>;

// Helper to create mock devices
const createMockDevice = (
  deviceId: string,
  options: {
    modelId?: DeviceModelId;
    deviceName?: string | null;
  } = {},
): Device => ({
  deviceId,
  deviceName: options.deviceName ?? `Device ${deviceId}`,
  modelId: options.modelId ?? DeviceModelId.nanoX,
  wired: false,
});

// Helper to create mock transport
const createMockTransport = (): Transport => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return {} as any;
};

describe("isLockedDevicePolling", () => {
  let mockGetAppAndVersion: jest.Mock;
  let mockTransport: Transport;
  let mockDevice: Device;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetAppAndVersion = jest.fn();
    mockTransport = createMockTransport();
    mockDevice = createMockDevice("test-device-1");
  });

  describe("successful getAppAndVersion", () => {
    it("should return unlocked result when getAppAndVersion succeeds", async () => {
      mockGetAppAndVersion.mockResolvedValue({ name: "Bitcoin", version: "1.0.0" });

      const observable = isLockedDevicePolling(
        mockDevice,
        mockTransport,
        mockGetAppAndVersion,
        1000,
      );
      const result = await firstValueFrom(observable.pipe(take(1)));

      expect(result).toEqual({ type: IsDeviceLockedResultType.unlocked });
      expect(mockGetAppAndVersion).toHaveBeenCalledTimes(1);
      expect(mockGetAppAndVersion).toHaveBeenCalledWith(mockTransport, {});
    });

    it("should pass abortTimeoutMs option for nanoS devices", async () => {
      const nanoSDevice = createMockDevice("nano-s-device", { modelId: DeviceModelId.nanoS });
      mockGetAppAndVersion.mockResolvedValue({ name: "Bitcoin", version: "1.0.0" });

      const observable = isLockedDevicePolling(
        nanoSDevice,
        mockTransport,
        mockGetAppAndVersion,
        1000,
      );
      await firstValueFrom(observable.pipe(take(1)));

      expect(mockGetAppAndVersion).toHaveBeenCalledWith(mockTransport, { abortTimeoutMs: 500 });
    });

    it("should not pass abortTimeoutMs option for non-nanoS devices", async () => {
      const nanoXDevice = createMockDevice("nano-x-device", { modelId: DeviceModelId.nanoX });
      mockGetAppAndVersion.mockResolvedValue({ name: "Bitcoin", version: "1.0.0" });

      const observable = isLockedDevicePolling(
        nanoXDevice,
        mockTransport,
        mockGetAppAndVersion,
        1000,
      );
      await firstValueFrom(observable.pipe(take(1)));

      expect(mockGetAppAndVersion).toHaveBeenCalledWith(mockTransport, {});
    });
  });

  describe("error handling", () => {
    it("should return lockedStateCannotBeDetermined when error is CLA_NOT_SUPPORTED", async () => {
      const error = new TransportStatusError(StatusCodes.CLA_NOT_SUPPORTED);
      mockGetAppAndVersion.mockRejectedValue(error);

      const observable = isLockedDevicePolling(
        mockDevice,
        mockTransport,
        mockGetAppAndVersion,
        1000,
      );
      const result = await firstValueFrom(observable.pipe(take(1)));

      expect(result).toEqual({
        type: IsDeviceLockedResultType.lockedStateCannotBeDetermined,
      });
    });

    it("should return locked when error is SendApduTimeoutError", async () => {
      const error = new SendApduTimeoutError("Timeout");
      mockGetAppAndVersion.mockRejectedValue(error);

      const observable = isLockedDevicePolling(
        mockDevice,
        mockTransport,
        mockGetAppAndVersion,
        1000,
      );
      const result = await firstValueFrom(observable.pipe(take(1)));

      expect(result).toEqual({ type: IsDeviceLockedResultType.locked });
    });

    it("should return locked when error is TransportStatusError with LOCKED_DEVICE status", async () => {
      const error = new TransportStatusError(StatusCodes.LOCKED_DEVICE);
      mockGetAppAndVersion.mockRejectedValue(error);

      const observable = isLockedDevicePolling(
        mockDevice,
        mockTransport,
        mockGetAppAndVersion,
        1000,
      );
      const result = await firstValueFrom(observable.pipe(take(1)));

      expect(result).toEqual({ type: IsDeviceLockedResultType.locked });
    });

    it("should return error result for other TransportStatusError types", async () => {
      const error = new TransportStatusError(StatusCodes.UNKNOWN_APDU);
      mockGetAppAndVersion.mockRejectedValue(error);

      const observable = isLockedDevicePolling(
        mockDevice,
        mockTransport,
        mockGetAppAndVersion,
        1000,
      );
      const result = await firstValueFrom(observable.pipe(take(1)));

      expect(result).toEqual({
        type: IsDeviceLockedResultType.error,
        error: error,
      });
    });

    it("should return error result for generic Error", async () => {
      const error = new Error("Generic error");
      mockGetAppAndVersion.mockRejectedValue(error);

      const observable = isLockedDevicePolling(
        mockDevice,
        mockTransport,
        mockGetAppAndVersion,
        1000,
      );
      const result = await firstValueFrom(observable.pipe(take(1)));

      expect(result).toEqual({
        type: IsDeviceLockedResultType.error,
        error: error,
      });
    });
  });

  describe("polling behavior", () => {
    it("should poll repeatedly with the specified delay", async () => {
      // Make getAppAndVersion return a cold observable that resolves immediately
      mockGetAppAndVersion.mockResolvedValue({ name: "Bitcoin", version: "1.0.0" });

      const observable = isLockedDevicePolling(
        mockDevice,
        mockTransport,
        mockGetAppAndVersion,
        1000,
      );

      const results: IsDeviceLockedResult[] = [];

      const sub = observable.pipe(take(3)).subscribe({
        next: result => {
          results.push(result);
        },
      });

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(results.length).toBe(1);
      expect(results[0]).toEqual({ type: IsDeviceLockedResultType.unlocked });
      expect(mockGetAppAndVersion).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(results.length).toBe(2);
      expect(results[1]).toEqual({ type: IsDeviceLockedResultType.unlocked });
      expect(mockGetAppAndVersion).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(results.length).toBe(3);
      expect(results[2]).toEqual({ type: IsDeviceLockedResultType.unlocked });
      expect(mockGetAppAndVersion).toHaveBeenCalledTimes(3);

      sub.unsubscribe();
    });

    it("should continue polling after errors", async () => {
      const error = new Error("Test error");
      mockGetAppAndVersion.mockRejectedValue(error);

      const observable = isLockedDevicePolling(
        mockDevice,
        mockTransport,
        mockGetAppAndVersion,
        1000,
      );

      const results: IsDeviceLockedResult[] = [];

      const sub = observable.pipe(take(2)).subscribe({
        next: result => {
          results.push(result);
        },
      });

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(results.length).toBe(1);
      expect(results[0]).toEqual({ type: IsDeviceLockedResultType.error, error: error });
      expect(mockGetAppAndVersion).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(results.length).toBe(2);
      expect(results[1]).toEqual({ type: IsDeviceLockedResultType.error, error: error });
      expect(mockGetAppAndVersion).toHaveBeenCalledTimes(2);

      sub.unsubscribe();
    });

    it("should handle state changes between polling cycles", async () => {
      mockGetAppAndVersion
        .mockRejectedValueOnce(new TransportStatusError(StatusCodes.LOCKED_DEVICE))
        .mockRejectedValueOnce(new TransportStatusError(StatusCodes.LOCKED_DEVICE))
        .mockResolvedValueOnce({ name: "Bitcoin", version: "1.0.0" });

      const observable = isLockedDevicePolling(
        mockDevice,
        mockTransport,
        mockGetAppAndVersion,
        1000,
      );

      const results: IsDeviceLockedResult[] = [];

      const sub = observable.pipe(take(3)).subscribe({
        next: result => {
          results.push(result);
        },
      });

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(results.length).toBe(1);
      expect(results[0]).toEqual({ type: IsDeviceLockedResultType.locked });
      expect(mockGetAppAndVersion).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(results.length).toBe(2);
      expect(results[1]).toEqual({ type: IsDeviceLockedResultType.locked });
      expect(mockGetAppAndVersion).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(results.length).toBe(3);
      expect(results[2]).toEqual({ type: IsDeviceLockedResultType.unlocked });
      expect(mockGetAppAndVersion).toHaveBeenCalledTimes(3);

      sub.unsubscribe();
    });
  });
});

describe("useIsDeviceLockedPolling", () => {
  let mockDevice: Device;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDevice = createMockDevice("test-device-1");
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("initial state", () => {
    it("should return undetermined result on mount before polling starts", () => {
      // Use a Subject that won't emit until we tell it to
      const subject = new Subject<IsDeviceLockedResult>();
      mockWithDevice.mockReturnValue(() => subject.asObservable());

      const { result } = renderHook(() =>
        useIsDeviceLockedPolling({ device: mockDevice, enabled: true }),
      );

      // Before any emissions, result should be undetermined
      expect(result.current.result).toEqual({ type: IsDeviceLockedResultType.undetermined });
    });

    it("should expose a retry function", () => {
      const subject = new Subject<IsDeviceLockedResult>();
      mockWithDevice.mockReturnValue(() => subject.asObservable());

      const { result } = renderHook(() =>
        useIsDeviceLockedPolling({ device: mockDevice, enabled: true }),
      );

      expect(typeof result.current.retry).toBe("function");
    });
  });

  describe("disabled state", () => {
    it("should not start polling when enabled is false", () => {
      const { result } = renderHook(() =>
        useIsDeviceLockedPolling({ device: mockDevice, enabled: false }),
      );

      expect(mockWithDevice).not.toHaveBeenCalled();
      expect(result.current.result).toEqual({ type: IsDeviceLockedResultType.undetermined });
    });
  });

  describe("no device", () => {
    it("should not start polling when device is null", () => {
      const { result } = renderHook(() =>
        useIsDeviceLockedPolling({ device: null, enabled: true }),
      );

      expect(mockWithDevice).not.toHaveBeenCalled();
      expect(result.current.result).toEqual({ type: IsDeviceLockedResultType.undetermined });
    });
  });

  describe("polling lifecycle", () => {
    it("should start polling when both enabled and device are valid", async () => {
      const subject = new Subject<IsDeviceLockedResult>();
      mockWithDevice.mockReturnValue(() => subject.asObservable());

      const { result } = renderHook(() =>
        useIsDeviceLockedPolling({ device: mockDevice, enabled: true }),
      );

      expect(mockWithDevice).toHaveBeenCalledWith(mockDevice.deviceId);

      act(() => {
        subject.next({ type: IsDeviceLockedResultType.unlocked });
      });

      await waitFor(() => {
        expect(result.current.result).toEqual({ type: IsDeviceLockedResultType.unlocked });
      });
    });

    it("should update result when polling emits new values", async () => {
      const subject = new Subject<IsDeviceLockedResult>();
      mockWithDevice.mockReturnValue(() => subject.asObservable());

      const { result } = renderHook(() =>
        useIsDeviceLockedPolling({ device: mockDevice, enabled: true }),
      );

      act(() => {
        subject.next({ type: IsDeviceLockedResultType.locked });
      });

      await waitFor(() => {
        expect(result.current.result).toEqual({ type: IsDeviceLockedResultType.locked });
      });

      act(() => {
        subject.next({ type: IsDeviceLockedResultType.unlocked });
      });

      await waitFor(() => {
        expect(result.current.result).toEqual({ type: IsDeviceLockedResultType.unlocked });
      });
    });
  });

  describe("error handling", () => {
    it("should set error state when subscription errors", async () => {
      const testError = new Error("Connection failed");
      mockWithDevice.mockReturnValue(() => throwError(() => testError));

      const { result } = renderHook(() =>
        useIsDeviceLockedPolling({ device: mockDevice, enabled: true }),
      );

      await waitFor(() => {
        expect(result.current.result).toEqual({
          type: IsDeviceLockedResultType.error,
          error: testError,
        });
      });
    });
  });

  describe("cleanup", () => {
    it("should reset to undetermined when unmounted", async () => {
      const subject = new Subject<IsDeviceLockedResult>();
      mockWithDevice.mockReturnValue(() => subject.asObservable());

      const { result, unmount } = renderHook(() =>
        useIsDeviceLockedPolling({ device: mockDevice, enabled: true }),
      );

      act(() => {
        subject.next({ type: IsDeviceLockedResultType.unlocked });
      });

      await waitFor(() => {
        expect(result.current.result).toEqual({ type: IsDeviceLockedResultType.unlocked });
      });

      unmount();

      // After unmount, the result should have been reset, but we can't check it
      // We verify the subscription was cleaned up by checking subject has no observers
      expect(subject.observed).toBe(false);
    });

    it("should reset to undetermined when enabled changes to false", async () => {
      const subject = new Subject<IsDeviceLockedResult>();
      mockWithDevice.mockReturnValue(() => subject.asObservable());

      const { result, rerender } = renderHook<
        { result: IsDeviceLockedResult; retry: () => void },
        { device: Device; enabled: boolean }
      >(({ device, enabled }) => useIsDeviceLockedPolling({ device, enabled }), {
        initialProps: { device: mockDevice, enabled: true },
      });

      act(() => {
        subject.next({ type: IsDeviceLockedResultType.unlocked });
      });

      await waitFor(() => {
        expect(result.current.result).toEqual({ type: IsDeviceLockedResultType.unlocked });
      });

      rerender({ device: mockDevice, enabled: false });

      await waitFor(() => {
        expect(result.current.result).toEqual({ type: IsDeviceLockedResultType.undetermined });
      });
    });

    it("should reset to undetermined when device changes to null", async () => {
      const subject = new Subject<IsDeviceLockedResult>();
      mockWithDevice.mockReturnValue(() => subject.asObservable());

      const { result, rerender } = renderHook<
        { result: IsDeviceLockedResult; retry: () => void },
        { device: Device | null; enabled: boolean }
      >(({ device, enabled }) => useIsDeviceLockedPolling({ device, enabled }), {
        initialProps: { device: mockDevice, enabled: true },
      });

      act(() => {
        subject.next({ type: IsDeviceLockedResultType.unlocked });
      });

      await waitFor(() => {
        expect(result.current.result).toEqual({ type: IsDeviceLockedResultType.unlocked });
      });

      rerender({ device: null, enabled: true });

      await waitFor(() => {
        expect(result.current.result).toEqual({ type: IsDeviceLockedResultType.undetermined });
      });
    });
  });

  describe("retry mechanism", () => {
    it("should restart polling when retry is called", async () => {
      let callCount = 0;
      const subjects: Subject<IsDeviceLockedResult>[] = [];

      mockWithDevice.mockImplementation(() => () => {
        const subject = new Subject<IsDeviceLockedResult>();
        subjects.push(subject);
        callCount++;
        return subject.asObservable();
      });

      const { result } = renderHook(() =>
        useIsDeviceLockedPolling({ device: mockDevice, enabled: true }),
      );

      expect(callCount).toBe(1);

      act(() => {
        subjects[0].next({ type: IsDeviceLockedResultType.locked });
      });

      await waitFor(() => {
        expect(result.current.result).toEqual({ type: IsDeviceLockedResultType.locked });
      });

      // Call retry
      act(() => {
        result.current.retry();
      });

      await waitFor(() => {
        expect(callCount).toBe(2);
      });

      // Old subscription should be cleaned up
      expect(subjects[0].observed).toBe(false);

      // New subscription should receive new results
      act(() => {
        subjects[1].next({ type: IsDeviceLockedResultType.unlocked });
      });

      await waitFor(() => {
        expect(result.current.result).toEqual({ type: IsDeviceLockedResultType.unlocked });
      });
    });
  });
});
