import * as ExpoNetwork from "expo-network";
import { act, renderHook } from "@testing-library/react-native";
import { getNetworkState, subscribeToNetworkState, useNetworkState } from "./networkState.native";

jest.mock("expo-network", () => ({
  getNetworkStateAsync: jest.fn(),
  addNetworkStateListener: jest.fn(),
}));

const mockedGetNetworkStateAsync = jest.mocked(ExpoNetwork.getNetworkStateAsync);
const mockedAddNetworkStateListener = jest.mocked(ExpoNetwork.addNetworkStateListener);

const online = {
  type: "WIFI",
  isConnected: true,
  isInternetReachable: true,
} as ExpoNetwork.NetworkState;
const offline = {
  type: "NONE",
  isConnected: false,
  isInternetReachable: false,
} as ExpoNetwork.NetworkState;

describe("network state (native)", () => {
  let emit: (state: ExpoNetwork.NetworkState) => void;
  let resolveSnapshot: (state: ExpoNetwork.NetworkState) => void;
  let rejectSnapshot: (error: Error) => void;
  let remove: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    remove = jest.fn();
    mockedAddNetworkStateListener.mockImplementation(listener => {
      emit = listener;
      return { remove };
    });
    mockedGetNetworkStateAsync.mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          resolveSnapshot = resolve;
          rejectSnapshot = reject;
        }),
    );
  });

  describe("getNetworkState", () => {
    it("returns the current state without the connection type", async () => {
      mockedGetNetworkStateAsync.mockResolvedValue(online);

      await expect(getNetworkState()).resolves.toEqual({
        isConnected: true,
        isInternetReachable: true,
      });
    });

    it("returns an unknown state when the native read rejects", async () => {
      mockedGetNetworkStateAsync.mockRejectedValue(new Error("unavailable"));

      await expect(getNetworkState()).resolves.toEqual({});
    });
  });

  describe("subscribeToNetworkState", () => {
    it("emits the current state when no event arrived first", async () => {
      const listener = jest.fn();
      subscribeToNetworkState(listener);

      resolveSnapshot(offline);
      await Promise.resolve();

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ isConnected: false, isInternetReachable: false });
    });

    it("forwards network events", () => {
      const listener = jest.fn();
      subscribeToNetworkState(listener);

      emit(online);

      expect(listener).toHaveBeenCalledWith({ isConnected: true, isInternetReachable: true });
    });

    it("drops the current state when an event arrived first", async () => {
      const listener = jest.fn();
      subscribeToNetworkState(listener);

      emit(online);
      resolveSnapshot(offline);
      await Promise.resolve();

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ isConnected: true, isInternetReachable: true });
    });

    it("drops the current state after unsubscribing", async () => {
      const listener = jest.fn();
      const unsubscribe = subscribeToNetworkState(listener);

      unsubscribe();
      resolveSnapshot(offline);
      await Promise.resolve();

      expect(remove).toHaveBeenCalledTimes(1);
      expect(listener).not.toHaveBeenCalled();
    });

    it("ignores a failed read of the current state", async () => {
      const listener = jest.fn();
      subscribeToNetworkState(listener);

      rejectSnapshot(new Error("unavailable"));
      await Promise.resolve();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("useNetworkState", () => {
    it("starts unknown, then follows the current state and events", async () => {
      const { result, unmount } = renderHook(() => useNetworkState());

      expect(result.current).toEqual({});

      await act(async () => {
        resolveSnapshot(online);
      });
      expect(result.current).toEqual({ isConnected: true, isInternetReachable: true });

      act(() => {
        emit(offline);
      });
      expect(result.current).toEqual({ isConnected: false, isInternetReachable: false });

      unmount();
      expect(remove).toHaveBeenCalledTimes(1);
    });
  });
});
