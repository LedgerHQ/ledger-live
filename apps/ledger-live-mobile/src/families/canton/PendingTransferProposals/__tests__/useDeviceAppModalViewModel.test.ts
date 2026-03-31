/* eslint-disable @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any */
import { act, renderHook, waitFor } from "@tests/test-renderer";
import { useDeviceAppModalViewModel } from "../useDeviceAppModalViewModel";

describe("useDeviceAppModalViewModel", () => {
  const onConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderViewModel = (isOpen = true) =>
    renderHook(() =>
      useDeviceAppModalViewModel({
        isOpen,
        onConfirm,
        appName: "Canton",
      }),
    );

  describe("initial state", () => {
    it("should initialize with pending confirmation state", () => {
      const { result } = renderViewModel();

      expect(result.current.confirmationState).toBe("pending");
    });

    it("should initialize with no error", () => {
      const { result } = renderViewModel();

      expect(result.current.error).toBeNull();
    });

    it("should expose the request object containing the appName", () => {
      const { result } = renderViewModel();

      expect(result.current.request).toEqual({ appName: "Canton" });
    });
  });

  describe("handleDeviceResult", () => {
    it("should transition to confirming then completed when onConfirm resolves", async () => {
      onConfirm.mockResolvedValueOnce(undefined);
      const { result } = renderViewModel();

      act(() => {
        result.current.handleDeviceResult({
          device: { deviceId: "device-1", wired: true } as any,
        } as any);
      });

      expect(result.current.confirmationState).toBe("confirming");

      await waitFor(() => {
        expect(result.current.confirmationState).toBe("completed");
      });
    });

    it("should transition to error state when onConfirm rejects", async () => {
      const err = new Error("Signing failed");
      onConfirm.mockRejectedValueOnce(err);
      const { result } = renderViewModel();

      act(() => {
        result.current.handleDeviceResult({
          device: { deviceId: "device-1", wired: true } as any,
        } as any);
      });

      await waitFor(() => {
        expect(result.current.confirmationState).toBe("error");
        expect(result.current.error).toEqual(err);
      });
    });

    it("should use the wired fallback deviceId when deviceId is empty", async () => {
      onConfirm.mockResolvedValueOnce(undefined);
      const { result } = renderViewModel();

      act(() => {
        result.current.handleDeviceResult({
          device: { deviceId: "", wired: true } as any,
        } as any);
      });

      await waitFor(() => {
        expect(result.current.confirmationState).toBe("completed");
      });
      expect(onConfirm).toHaveBeenCalledWith("usb");
    });

    it("should use the ble fallback deviceId when not wired", async () => {
      onConfirm.mockResolvedValueOnce(undefined);
      const { result } = renderViewModel();

      act(() => {
        result.current.handleDeviceResult({
          device: { deviceId: "", wired: false } as any,
        } as any);
      });

      await waitFor(() => {
        expect(result.current.confirmationState).toBe("completed");
      });
      expect(onConfirm).toHaveBeenCalledWith("ble");
    });

    it("should not confirm when deviceResult has no device", () => {
      const { result } = renderViewModel();

      act(() => {
        result.current.handleDeviceResult({} as any);
      });

      expect(onConfirm).not.toHaveBeenCalled();
      expect(result.current.confirmationState).toBe("pending");
    });
  });

  describe("handleRetry", () => {
    it("should reset confirmationState to pending and clear the error", async () => {
      onConfirm.mockRejectedValueOnce(new Error("fail"));
      const { result } = renderViewModel();

      act(() => {
        result.current.handleDeviceResult({
          device: { deviceId: "device-1", wired: true } as any,
        } as any);
      });

      await waitFor(() => {
        expect(result.current.confirmationState).toBe("error");
      });

      act(() => {
        result.current.handleRetry();
      });

      expect(result.current.confirmationState).toBe("pending");
      expect(result.current.error).toBeNull();
    });
  });
});
