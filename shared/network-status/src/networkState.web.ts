import { useEffect, useState } from "react";
import type { NetworkState, NetworkStateListener } from "./types";

function readNetworkState(): NetworkState {
  const isConnected = navigator.onLine;
  return { isConnected, isInternetReachable: isConnected };
}

export async function getNetworkState(): Promise<NetworkState> {
  return readNetworkState();
}

export function subscribeToNetworkState(listener: NetworkStateListener): () => void {
  const handleChange = () => listener(readNetworkState());

  window.addEventListener("online", handleChange);
  window.addEventListener("offline", handleChange);
  handleChange();

  return () => {
    window.removeEventListener("online", handleChange);
    window.removeEventListener("offline", handleChange);
  };
}

export function useNetworkState(): NetworkState {
  const [state, setState] = useState<NetworkState>(readNetworkState);
  useEffect(() => subscribeToNetworkState(setState), []);
  return state;
}
