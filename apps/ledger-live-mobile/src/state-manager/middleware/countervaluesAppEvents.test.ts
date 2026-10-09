import NetInfo, {
  NetInfoStateType,
  type NetInfoChangeHandler,
  type NetInfoNoConnectionState,
  type NetInfoOtherState,
  type NetInfoState,
  type NetInfoUnknownState,
} from "@react-native-community/netinfo";
import type { CountervaluesPollingControls } from "@features/platform-market-countervalues";
import { AppState, type AppStateStatus } from "react-native";
import { subscribeCountervaluesAppEvents } from "./countervaluesAppEvents";

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

function createPolling(): CountervaluesPollingControls {
  return {
    poll: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  };
}

describe("subscribeCountervaluesAppEvents", () => {
  let appStateListener: ((state: AppStateStatus) => void) | undefined;
  let netInfoListener: NetInfoChangeHandler | undefined;
  let removeAppStateListener: jest.Mock;
  let unsubscribeNetInfo: jest.Mock;
  let appStateAddEventListenerSpy: jest.SpiedFunction<typeof AppState.addEventListener>;
  let polling: CountervaluesPollingControls;

  beforeEach(() => {
    jest.clearAllMocks();
    appStateListener = undefined;
    netInfoListener = undefined;
    removeAppStateListener = jest.fn();
    unsubscribeNetInfo = jest.fn();
    polling = createPolling();

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

  it("should start polling without an immediate poll when subscribed while active", () => {
    setCurrentAppState("active");

    subscribeCountervaluesAppEvents(polling);

    expect(polling.start).toHaveBeenCalledTimes(1);
    expect(polling.poll).not.toHaveBeenCalled();
    expect(polling.stop).not.toHaveBeenCalled();
  });

  it.each(["background", "inactive", null] as const)(
    "should stop polling when subscribed in %s state",
    initialState => {
      setCurrentAppState(initialState);

      subscribeCountervaluesAppEvents(polling);

      expect(polling.stop).toHaveBeenCalledTimes(1);
      expect(polling.start).not.toHaveBeenCalled();
      expect(polling.poll).not.toHaveBeenCalled();
    },
  );

  it("should ignore duplicate lifecycle events while stopping and resuming", () => {
    setCurrentAppState("active");
    subscribeCountervaluesAppEvents(polling);
    jest.clearAllMocks();

    {
      // React Native can emit duplicate notifications while transitioning.
      appStateListener?.("background");
      appStateListener?.("background");
      appStateListener?.("inactive");
    }

    expect(polling.stop).toHaveBeenCalledTimes(1);

    {
      // A repeated active event must not schedule another refresh.
      appStateListener?.("active");
      appStateListener?.("active");
    }

    expect(polling.start).toHaveBeenCalledTimes(1);
    expect(polling.poll).toHaveBeenCalledTimes(1);
    expect(jest.mocked(polling.start).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(polling.poll).mock.invocationCallOrder[0],
    );
  });

  it("should resume polling from an initially unknown app state", () => {
    setCurrentAppState(null);
    subscribeCountervaluesAppEvents(polling);
    jest.clearAllMocks();

    {
      appStateListener?.("active");
    }

    expect(polling.start).toHaveBeenCalledTimes(1);
    expect(polling.poll).toHaveBeenCalledTimes(1);
  });

  it("should ignore the initial network update", () => {
    setCurrentAppState("active");
    subscribeCountervaluesAppEvents(polling);
    jest.clearAllMocks();

    {
      netInfoListener?.(buildNetInfoState("offline"));
    }

    expect(polling.poll).not.toHaveBeenCalled();
  });

  it("should poll once when the network transitions from offline to online while active", () => {
    setCurrentAppState("active");
    subscribeCountervaluesAppEvents(polling);
    jest.clearAllMocks();

    {
      netInfoListener?.(buildNetInfoState("offline"));
      netInfoListener?.(buildNetInfoState("unknown"));
      netInfoListener?.(buildNetInfoState("online"));
      netInfoListener?.(buildNetInfoState("online"));
    }

    expect(polling.poll).toHaveBeenCalledTimes(1);
    expect(polling.start).not.toHaveBeenCalled();
    expect(polling.stop).not.toHaveBeenCalled();
  });

  it("should not poll on reconnection while in background", () => {
    setCurrentAppState("active");
    subscribeCountervaluesAppEvents(polling);
    jest.clearAllMocks();

    {
      netInfoListener?.(buildNetInfoState("offline"));
      appStateListener?.("background");
      netInfoListener?.(buildNetInfoState("online"));
    }

    expect(polling.poll).not.toHaveBeenCalled();
  });

  it("should remove app state and network listeners when unsubscribed", () => {
    setCurrentAppState("active");
    const unsubscribe = subscribeCountervaluesAppEvents(polling);

    unsubscribe();

    expect(removeAppStateListener).toHaveBeenCalledTimes(1);
    expect(unsubscribeNetInfo).toHaveBeenCalledTimes(1);
  });
});
