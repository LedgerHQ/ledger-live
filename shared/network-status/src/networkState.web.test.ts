import { act, renderHook } from "@testing-library/react";
import { getNetworkState, subscribeToNetworkState, useNetworkState } from "./networkState.web";

const onLine = jest.spyOn(navigator, "onLine", "get");

function goOnline() {
  onLine.mockReturnValue(true);
  window.dispatchEvent(new Event("online"));
}

function goOffline() {
  onLine.mockReturnValue(false);
  window.dispatchEvent(new Event("offline"));
}

describe("network state (web)", () => {
  beforeEach(() => {
    onLine.mockReturnValue(true);
  });

  describe("getNetworkState", () => {
    it("returns the navigator status", async () => {
      onLine.mockReturnValue(false);

      await expect(getNetworkState()).resolves.toEqual({
        isConnected: false,
        isInternetReachable: false,
      });
    });
  });

  describe("subscribeToNetworkState", () => {
    it("emits the current state on subscribe", () => {
      const listener = jest.fn();
      const unsubscribe = subscribeToNetworkState(listener);

      expect(listener).toHaveBeenCalledWith({ isConnected: true, isInternetReachable: true });
      unsubscribe();
    });

    it("emits on online and offline events", () => {
      const listener = jest.fn();
      const unsubscribe = subscribeToNetworkState(listener);
      listener.mockClear();

      goOffline();
      goOnline();

      expect(listener.mock.calls).toEqual([
        [{ isConnected: false, isInternetReachable: false }],
        [{ isConnected: true, isInternetReachable: true }],
      ]);
      unsubscribe();
    });

    it("stops emitting after unsubscribing", () => {
      const listener = jest.fn();
      const unsubscribe = subscribeToNetworkState(listener);
      listener.mockClear();

      unsubscribe();
      goOffline();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("useNetworkState", () => {
    it("starts from the navigator status and follows events", () => {
      onLine.mockReturnValue(false);
      const { result } = renderHook(() => useNetworkState());

      expect(result.current).toEqual({ isConnected: false, isInternetReachable: false });

      act(() => {
        goOnline();
      });

      expect(result.current).toEqual({ isConnected: true, isInternetReachable: true });
    });
  });
});
