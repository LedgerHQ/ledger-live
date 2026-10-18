import type { CountervaluesPollingControls } from "@features/platform-market-countervalues";
import { AppState, type AppStateStatus } from "react-native";
import { subscribeToNetworkState, type NetworkState } from "@shared/network-status";

type NetworkStatus = "online" | "offline" | "unknown";

function getNetworkStatus(state: NetworkState): NetworkStatus {
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
): (state: NetworkState) => void {
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

/**
 * Polling follows the app: it starts when the app is active and stops in the background, refreshes
 * when the app comes back, and refreshes when the network returns to an active app.
 */
export function subscribeCountervaluesAppEvents({
  poll,
  start,
  stop,
}: CountervaluesPollingControls): () => void {
  let currentAppState = AppState.currentState;

  if (currentAppState === "active") {
    start();
  } else {
    stop();
  }

  const appStateSubscription = AppState.addEventListener(
    "change",
    (nextAppState: AppStateStatus) => {
      const wasActive = currentAppState === "active";
      const isActive = nextAppState === "active";

      currentAppState = nextAppState;

      if (wasActive === isActive) return;

      if (isActive) {
        start();
        poll();
      } else {
        stop();
      }
    },
  );

  const unsubscribeNetwork = subscribeToNetworkState(
    createNetworkChangeHandler(() => currentAppState, poll),
  );

  return () => {
    appStateSubscription.remove();
    unsubscribeNetwork();
  };
}
