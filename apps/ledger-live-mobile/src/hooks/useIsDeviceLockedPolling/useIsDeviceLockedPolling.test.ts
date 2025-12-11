import { firstValueFrom, take } from "rxjs";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import Transport, { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { DeviceModelId } from "@ledgerhq/devices/index";
import { SendApduTimeoutError } from "@ledgerhq/device-management-kit";
import { isLockedDevicePolling } from "./useIsDeviceLockedPolling";
import { IsDeviceLockedResultType, IsDeviceLockedResult } from "./types";

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
