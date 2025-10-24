import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBleState, BleState, UndeterminedBleStates } from "./useBleState";

describe("useBleState", () => {
  let mockObserveStateFn: ReturnType<typeof vi.fn>;
  let mockRequestCurrentStateFn: ReturnType<typeof vi.fn>;
  let mockRemove: ReturnType<typeof vi.fn>;
  let stateListener: ((state: BleState) => void) | null = null;

  beforeEach(() => {
    mockRemove = vi.fn();
    mockObserveStateFn = vi.fn().mockImplementation((listener: (state: BleState) => void) => {
      stateListener = listener;
      return { remove: mockRemove };
    });
    mockRequestCurrentStateFn = vi.fn();
  });

  afterEach(() => {
    stateListener = null;
    vi.clearAllMocks();
  });

  describe("basic functionality", () => {
    it("should initialize with Unknown state", () => {
      const { result } = renderHook(() =>
        useBleState(true, mockObserveStateFn, mockRequestCurrentStateFn),
      );

      expect(result.current).toBe(BleState.Unknown);
      expect(mockObserveStateFn).toHaveBeenCalledTimes(1);
    });

    it("should not observe state when disabled", () => {
      renderHook(() => useBleState(false, mockObserveStateFn, mockRequestCurrentStateFn));

      expect(mockObserveStateFn).not.toHaveBeenCalled();
    });

    it("should call observeStateFn with correct listener", () => {
      renderHook(() => useBleState(true, mockObserveStateFn, mockRequestCurrentStateFn));

      expect(mockObserveStateFn).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe("state updates", () => {
    it("should update state when observeStateFn emits PoweredOn", () => {
      const { result } = renderHook(() =>
        useBleState(true, mockObserveStateFn, mockRequestCurrentStateFn),
      );

      act(() => {
        stateListener?.(BleState.PoweredOn);
      });

      expect(result.current).toBe(BleState.PoweredOn);
    });

    it("should update state when observeStateFn emits PoweredOff", () => {
      const { result } = renderHook(() =>
        useBleState(true, mockObserveStateFn, mockRequestCurrentStateFn),
      );

      act(() => {
        stateListener?.(BleState.PoweredOff);
      });

      expect(result.current).toBe(BleState.PoweredOff);
    });

    it("should update state when observeStateFn emits Unsupported", () => {
      const { result } = renderHook(() =>
        useBleState(true, mockObserveStateFn, mockRequestCurrentStateFn),
      );

      act(() => {
        stateListener?.(BleState.Unsupported);
      });

      expect(result.current).toBe(BleState.Unsupported);
    });

    it("should update state when observeStateFn emits Unauthorized", () => {
      const { result } = renderHook(() =>
        useBleState(true, mockObserveStateFn, mockRequestCurrentStateFn),
      );

      act(() => {
        stateListener?.(BleState.Unauthorized);
      });

      expect(result.current).toBe(BleState.Unauthorized);
    });

    it("should handle multiple state changes", () => {
      const { result } = renderHook(() =>
        useBleState(true, mockObserveStateFn, mockRequestCurrentStateFn),
      );

      act(() => {
        stateListener?.(BleState.PoweredOff);
      });
      expect(result.current).toBe(BleState.PoweredOff);

      act(() => {
        stateListener?.(BleState.PoweredOn);
      });
      expect(result.current).toBe(BleState.PoweredOn);

      act(() => {
        stateListener?.(BleState.Unsupported);
      });
      expect(result.current).toBe(BleState.Unsupported);
    });
  });

  describe("undetermined states handling", () => {
    it("should call requestCurrentStateFn when state is Unknown", async () => {
      mockRequestCurrentStateFn.mockResolvedValue(BleState.PoweredOn);

      const { result } = renderHook(() =>
        useBleState(true, mockObserveStateFn, mockRequestCurrentStateFn),
      );

      act(() => {
        stateListener?.(BleState.Unknown);
      });

      expect(result.current).toBe(BleState.Unknown);
      expect(mockRequestCurrentStateFn).toHaveBeenCalledTimes(1);

      // Wait for the async request to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current).toBe(BleState.PoweredOn);
    });

    it("should call requestCurrentStateFn when state is Resetting", async () => {
      mockRequestCurrentStateFn.mockResolvedValue(BleState.PoweredOff);

      const { result } = renderHook(() =>
        useBleState(true, mockObserveStateFn, mockRequestCurrentStateFn),
      );

      act(() => {
        stateListener?.(BleState.Resetting);
      });

      expect(result.current).toBe(BleState.Resetting);
      expect(mockRequestCurrentStateFn).toHaveBeenCalledTimes(1);

      // Wait for the async request to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current).toBe(BleState.PoweredOff);
    });

    it("should not call requestCurrentStateFn for non-undetermined states", () => {
      const { result } = renderHook(() =>
        useBleState(true, mockObserveStateFn, mockRequestCurrentStateFn),
      );

      act(() => {
        stateListener?.(BleState.PoweredOn);
      });

      expect(result.current).toBe(BleState.PoweredOn);
      expect(mockRequestCurrentStateFn).not.toHaveBeenCalled();
    });

    it("should handle requestCurrentStateFn returning another undetermined state", async () => {
      mockRequestCurrentStateFn.mockResolvedValue(BleState.Resetting);

      const { result } = renderHook(() =>
        useBleState(true, mockObserveStateFn, mockRequestCurrentStateFn),
      );

      act(() => {
        stateListener?.(BleState.Unknown);
      });

      expect(result.current).toBe(BleState.Unknown);

      // Wait for the async request to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should update to the new undetermined state
      expect(result.current).toBe(BleState.Resetting);
    });
  });

  describe("race condition handling", () => {
    it("should not update state if component is unmounted during async request", async () => {
      mockRequestCurrentStateFn.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(BleState.PoweredOn), 100)),
      );

      const { result, unmount } = renderHook(() =>
        useBleState(true, mockObserveStateFn, mockRequestCurrentStateFn),
      );

      act(() => {
        stateListener?.(BleState.Unknown);
      });

      expect(result.current).toBe(BleState.Unknown);

      // Unmount before the async request completes
      unmount();

      // Wait for the async request to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // The state should not have been updated after unmount
      expect(mockRequestCurrentStateFn).toHaveBeenCalledTimes(1);
    });

    it("should not update state if state changed to non-undetermined during async request", async () => {
      mockRequestCurrentStateFn.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(BleState.PoweredOn), 100)),
      );

      const { result } = renderHook(() =>
        useBleState(true, mockObserveStateFn, mockRequestCurrentStateFn),
      );

      act(() => {
        stateListener?.(BleState.Unknown);
      });

      expect(result.current).toBe(BleState.Unknown);

      // Change state to non-undetermined while async request is pending
      act(() => {
        stateListener?.(BleState.PoweredOff);
      });

      expect(result.current).toBe(BleState.PoweredOff);

      // Wait for the async request to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // The state should remain PoweredOff, not be updated to PoweredOn
      expect(result.current).toBe(BleState.PoweredOff);
    });

    it("should update state if current state is still undetermined when async request completes", async () => {
      mockRequestCurrentStateFn.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(BleState.PoweredOn), 100)),
      );

      const { result } = renderHook(() =>
        useBleState(true, mockObserveStateFn, mockRequestCurrentStateFn),
      );

      act(() => {
        stateListener?.(BleState.Unknown);
      });

      expect(result.current).toBe(BleState.Unknown);

      // Wait for the async request to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // The state should be updated to PoweredOn
      expect(result.current).toBe(BleState.PoweredOn);
    });
  });

  describe("cleanup", () => {
    it("should call remove on subscription when component unmounts", () => {
      const { unmount } = renderHook(() =>
        useBleState(true, mockObserveStateFn, mockRequestCurrentStateFn),
      );

      unmount();

      expect(mockRemove).toHaveBeenCalledTimes(1);
    });

    it("should call remove and re-subscribe when enabled changes from false to true", () => {
      const { rerender } = renderHook(
        ({ enabled }) => useBleState(enabled, mockObserveStateFn, mockRequestCurrentStateFn),
        { initialProps: { enabled: false } },
      );

      expect(mockObserveStateFn).not.toHaveBeenCalled();

      rerender({ enabled: true });

      expect(mockObserveStateFn).toHaveBeenCalledTimes(1);
    });

    it("should call remove and stop observing when enabled changes from true to false", () => {
      const { rerender } = renderHook(
        ({ enabled }) => useBleState(enabled, mockObserveStateFn, mockRequestCurrentStateFn),
        { initialProps: { enabled: true } },
      );

      expect(mockObserveStateFn).toHaveBeenCalledTimes(1);

      rerender({ enabled: false });

      expect(mockRemove).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    it("should handle requestCurrentStateFn rejection gracefully", async () => {
      // Mock console.error to prevent unhandled rejection warnings
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Mock the unhandled rejection to prevent test failure
      const unhandledRejectionHandler = vi.fn();
      process.on("unhandledRejection", unhandledRejectionHandler);
      mockRequestCurrentStateFn.mockRejectedValue(new Error("Request failed"));

      const { result } = renderHook(() =>
        useBleState(true, mockObserveStateFn, mockRequestCurrentStateFn),
      );

      act(() => {
        stateListener?.(BleState.Unknown);
      });

      expect(result.current).toBe(BleState.Unknown);

      // Wait for the async request to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // State should remain Unknown since the request failed
      expect(result.current).toBe(BleState.Unknown);
      expect(mockRequestCurrentStateFn).toHaveBeenCalledTimes(1);

      // Cleanup
      consoleErrorSpy.mockRestore();
      process.removeListener("unhandledRejection", unhandledRejectionHandler);
    });
  });

  describe("UndeterminedBleStates constant", () => {
    it("should include Unknown and Resetting states", () => {
      expect(UndeterminedBleStates).toEqual([BleState.Unknown, BleState.Resetting]);
    });
  });
});
