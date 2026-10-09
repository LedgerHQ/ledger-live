import {
  addNetworkStateListener,
  getNetworkStateAsync,
  NetworkStateType,
  type NetworkState,
} from "expo-network";
import { subscribeToNetworkState } from "../subscribeToNetworkState";

const online: NetworkState = {
  type: NetworkStateType.WIFI,
  isConnected: true,
  isInternetReachable: true,
};
const offline: NetworkState = {
  type: NetworkStateType.NONE,
  isConnected: false,
  isInternetReachable: false,
};

describe("subscribeToNetworkState", () => {
  let emit: (state: NetworkState) => void;
  let resolveSnapshot: (state: NetworkState) => void;
  let rejectSnapshot: (error: Error) => void;
  let remove: jest.Mock;

  beforeEach(() => {
    remove = jest.fn();
    jest.mocked(addNetworkStateListener).mockImplementation(listener => {
      emit = listener;
      return { remove };
    });
    jest.mocked(getNetworkStateAsync).mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          resolveSnapshot = resolve;
          rejectSnapshot = reject;
        }),
    );
  });

  it("should emit the current state when no event arrived first", async () => {
    const listener = jest.fn();
    subscribeToNetworkState(listener);

    resolveSnapshot(offline);
    await Promise.resolve();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(offline);
  });

  it("should forward network events", () => {
    const listener = jest.fn();
    subscribeToNetworkState(listener);

    emit(online);

    expect(listener).toHaveBeenCalledWith(online);
  });

  it("should drop the current state when an event arrived first", async () => {
    const listener = jest.fn();
    subscribeToNetworkState(listener);

    emit(online);
    resolveSnapshot(offline);
    await Promise.resolve();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(online);
  });

  it("should drop the current state after unsubscribing", async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToNetworkState(listener);

    unsubscribe();
    resolveSnapshot(offline);
    await Promise.resolve();

    expect(remove).toHaveBeenCalledTimes(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it("should ignore a failed read of the current state", async () => {
    const listener = jest.fn();
    subscribeToNetworkState(listener);

    rejectSnapshot(new Error("unavailable"));
    await Promise.resolve();

    expect(listener).not.toHaveBeenCalled();
  });
});
