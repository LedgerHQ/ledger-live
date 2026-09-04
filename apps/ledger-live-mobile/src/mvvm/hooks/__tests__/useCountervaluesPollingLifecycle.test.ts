import NetInfo, {
  NetInfoStateType,
  type NetInfoChangeHandler,
  type NetInfoNoConnectionState,
  type NetInfoOtherState,
  type NetInfoState,
  type NetInfoUnknownState,
} from "@react-native-community/netinfo";
import { type Polling, useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { act, renderHook } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";
import { useCountervaluesPollingLifecycle } from "../useCountervaluesPollingLifecycle";

jest.mock("@ledgerhq/live-countervalues-react", () => ({
  useCountervaluesPolling: jest.fn(),
}));

const mockedUseCountervaluesPolling = jest.mocked(useCountervaluesPolling);
const originalAppStateDescriptor = Object.getOwnPropertyDescriptor(AppState, "currentState");

function buildNetInfoState(status: "online" | "offline" | "unknown"): NetInfoState {
  if (status === "online") {
    const state: NetInfoOtherState = {
      type: NetInfoStateType.other,
      isConnected: true,
      isInternetReachable: true,
      details: { isConnectionExpensive: false },
    };

    return state;
  }

  if (status === "offline") {
    const state: NetInfoNoConnectionState = {
      type: NetInfoStateType.none,
      isConnected: false,
      isInternetReachable: false,
      details: null,
    };

    return state;
  }

  const state: NetInfoUnknownState = {
    type: NetInfoStateType.unknown,
    isConnected: null,
    isInternetReachable: null,
    details: null,
  };

  return state;
}

function setCurrentAppState(state: AppStateStatus | null): void {
  Object.defineProperty(AppState, "currentState", {
    configurable: true,
    value: state,
  });
}

function createPolling(): Polling {
  return {
    error: null,
    pending: false,
    poll: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    wipe: jest.fn(),
  };
}

describe("useCountervaluesPollingLifecycle", () => {
  let appStateListener: ((state: AppStateStatus) => void) | undefined;
  let netInfoListener: NetInfoChangeHandler | undefined;
  let removeAppStateListener: jest.Mock;
  let unsubscribeNetInfo: jest.Mock;
  let appStateAddEventListenerSpy: jest.SpiedFunction<typeof AppState.addEventListener>;
  let polling: Polling;

  beforeEach(() => {
    jest.clearAllMocks();
    appStateListener = undefined;
    netInfoListener = undefined;
    removeAppStateListener = jest.fn();
    unsubscribeNetInfo = jest.fn();
    polling = createPolling();
    mockedUseCountervaluesPolling.mockReturnValue(polling);

    appStateAddEventListenerSpy = jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_event, listener) => {
        appStateListener = listener;
        return { remove: removeAppStateListener };
      });

    jest.mocked(NetInfo.addEventListener).mockImplementation(listener => {
      netInfoListener = listener;
      return unsubscribeNetInfo;
    });
  });

  afterEach(() => {
    appStateAddEventListenerSpy.mockRestore();
    if (originalAppStateDescriptor) {
      Object.defineProperty(AppState, "currentState", originalAppStateDescriptor);
    } else {
      Reflect.deleteProperty(AppState, "currentState");
    }
  });

  it("should start polling without an immediate poll when mounted active", () => {
    setCurrentAppState("active");

    renderHook(() => useCountervaluesPollingLifecycle());

    expect(polling.start).toHaveBeenCalledTimes(1);
    expect(polling.poll).not.toHaveBeenCalled();
    expect(polling.stop).not.toHaveBeenCalled();
  });

  it.each(["background", "inactive", null] as const)(
    "should stop polling when mounted in %s state",
    initialState => {
      setCurrentAppState(initialState);

      renderHook(() => useCountervaluesPollingLifecycle());

      expect(polling.stop).toHaveBeenCalledTimes(1);
      expect(polling.start).not.toHaveBeenCalled();
      expect(polling.poll).not.toHaveBeenCalled();
    },
  );

  it("should ignore duplicate lifecycle events while stopping and resuming", () => {
    setCurrentAppState("active");
    renderHook(() => useCountervaluesPollingLifecycle());
    jest.clearAllMocks();

    act(() => {
      // React Native can emit duplicate notifications while transitioning.
      appStateListener?.("background");
      appStateListener?.("background");
      appStateListener?.("inactive");
    });

    expect(polling.stop).toHaveBeenCalledTimes(1);

    act(() => {
      // A repeated active event must not schedule another refresh.
      appStateListener?.("active");
      appStateListener?.("active");
    });

    expect(polling.start).toHaveBeenCalledTimes(1);
    expect(polling.poll).toHaveBeenCalledTimes(1);
    expect(jest.mocked(polling.start).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(polling.poll).mock.invocationCallOrder[0],
    );
  });

  it("should resume polling from an initially unknown app state", () => {
    setCurrentAppState(null);
    renderHook(() => useCountervaluesPollingLifecycle());
    jest.clearAllMocks();

    act(() => {
      appStateListener?.("active");
    });

    expect(polling.start).toHaveBeenCalledTimes(1);
    expect(polling.poll).toHaveBeenCalledTimes(1);
  });

  it("should ignore the initial network update", () => {
    setCurrentAppState("active");
    renderHook(() => useCountervaluesPollingLifecycle());
    jest.clearAllMocks();

    act(() => {
      netInfoListener?.(buildNetInfoState("offline"));
    });

    expect(polling.poll).not.toHaveBeenCalled();
  });

  it("should poll once when the network transitions from offline to online while active", () => {
    setCurrentAppState("active");
    renderHook(() => useCountervaluesPollingLifecycle());
    jest.clearAllMocks();

    act(() => {
      netInfoListener?.(buildNetInfoState("offline"));
      netInfoListener?.(buildNetInfoState("unknown"));
      netInfoListener?.(buildNetInfoState("online"));
      netInfoListener?.(buildNetInfoState("online"));
    });

    expect(polling.poll).toHaveBeenCalledTimes(1);
    expect(polling.start).not.toHaveBeenCalled();
    expect(polling.stop).not.toHaveBeenCalled();
  });

  it("should not poll on reconnection while in background", () => {
    setCurrentAppState("active");
    renderHook(() => useCountervaluesPollingLifecycle());
    jest.clearAllMocks();

    act(() => {
      netInfoListener?.(buildNetInfoState("offline"));
      appStateListener?.("background");
      netInfoListener?.(buildNetInfoState("online"));
    });

    expect(polling.poll).not.toHaveBeenCalled();
  });

  it("should keep listeners stable and use the latest polling actions after rerender", () => {
    setCurrentAppState("active");
    const { rerender } = renderHook(() => useCountervaluesPollingLifecycle());
    const nextPolling = createPolling();

    mockedUseCountervaluesPolling.mockReturnValue(nextPolling);
    rerender(undefined);
    jest.mocked(polling.start).mockClear();
    jest.mocked(polling.stop).mockClear();
    jest.mocked(polling.poll).mockClear();

    act(() => {
      appStateListener?.("background");
      appStateListener?.("active");
    });

    expect(appStateAddEventListenerSpy).toHaveBeenCalledTimes(1);
    expect(NetInfo.addEventListener).toHaveBeenCalledTimes(1);
    expect(polling.start).not.toHaveBeenCalled();
    expect(polling.stop).not.toHaveBeenCalled();
    expect(polling.poll).not.toHaveBeenCalled();
    expect(nextPolling.stop).toHaveBeenCalledTimes(1);
    expect(nextPolling.start).toHaveBeenCalledTimes(1);
    expect(nextPolling.poll).toHaveBeenCalledTimes(1);
  });

  it("should remove app state and network listeners when unmounted", () => {
    setCurrentAppState("active");
    const { unmount } = renderHook(() => useCountervaluesPollingLifecycle());

    unmount();

    expect(removeAppStateListener).toHaveBeenCalledTimes(1);
    expect(unsubscribeNetInfo).toHaveBeenCalledTimes(1);
  });
});
