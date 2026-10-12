import * as ExpoNetwork from "expo-network";
import { useEffect, useState } from "react";
import type { NetworkState, NetworkStateListener } from "./types";

function toNetworkState({
  isConnected,
  isInternetReachable,
}: ExpoNetwork.NetworkState): NetworkState {
  return { isConnected, isInternetReachable };
}

export async function getNetworkState(): Promise<NetworkState> {
  try {
    return toNetworkState(await ExpoNetwork.getNetworkStateAsync());
  } catch {
    return {};
  }
}

export function subscribeToNetworkState(listener: NetworkStateListener): () => void {
  let isActive = true;
  let hasReceivedEvent = false;

  const subscription = ExpoNetwork.addNetworkStateListener(state => {
    hasReceivedEvent = true;
    listener(toNetworkState(state));
  });

  ExpoNetwork.getNetworkStateAsync()
    .then(state => {
      if (isActive && !hasReceivedEvent) listener(toNetworkState(state));
    })
    .catch(() => {});

  return () => {
    isActive = false;
    subscription.remove();
  };
}

export function useNetworkState(): NetworkState {
  const [state, setState] = useState<NetworkState>({});
  useEffect(() => subscribeToNetworkState(setState), []);
  return state;
}
