import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { type Polling, useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

type PollingActions = Pick<Polling, "poll" | "start" | "stop">;
type NetworkStatus = "online" | "offline" | "unknown";

function getNetworkStatus(state: NetInfoState): NetworkStatus {
  if (state.isConnected === false || state.isInternetReachable === false) {
    return "offline";
  }

  if (state.isConnected === true && state.isInternetReachable === true) {
    return "online";
  }

  return "unknown";
}

function createNetworkChangeHandler(
  getAppState: () => AppStateStatus | null,
  poll: () => void,
): (state: NetInfoState) => void {
  let previousNetworkStatus: NetworkStatus | null = null;
  let isFirstNetworkUpdate = true;

  return state => {
    const networkStatus = getNetworkStatus(state);

    if (isFirstNetworkUpdate) {
      isFirstNetworkUpdate = false;
      previousNetworkStatus = networkStatus;
      return;
    }

    if (networkStatus === "unknown") return;

    const wasOffline = previousNetworkStatus === "offline";
    previousNetworkStatus = networkStatus;

    if (wasOffline && networkStatus === "online" && getAppState() === "active") {
      poll();
    }
  };
}

export function useCountervaluesPollingLifecycle(): void {
  const { poll, start, stop } = useCountervaluesPolling();
  const pollingActionsRef = useRef<PollingActions>({ poll, start, stop });

  useEffect(() => {
    pollingActionsRef.current = { poll, start, stop };
  }, [poll, start, stop]);

  useEffect(() => {
    let currentAppState = AppState.currentState;

    if (currentAppState === "active") {
      pollingActionsRef.current.start();
    } else {
      pollingActionsRef.current.stop();
    }

    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        const wasActive = currentAppState === "active";
        const isActive = nextAppState === "active";

        currentAppState = nextAppState;

        if (wasActive === isActive) return;

        if (isActive) {
          pollingActionsRef.current.start();
          pollingActionsRef.current.poll();
        } else {
          pollingActionsRef.current.stop();
        }
      },
    );

    const unsubscribeNetInfo = NetInfo.addEventListener(
      createNetworkChangeHandler(
        () => currentAppState,
        () => pollingActionsRef.current.poll(),
      ),
    );

    return () => {
      appStateSubscription.remove();
      unsubscribeNetInfo();
    };
  }, []);
}
