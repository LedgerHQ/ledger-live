import { addNetworkStateListener, getNetworkStateAsync, type NetworkState } from "expo-network";
import { onlineManager } from "@tanstack/react-query";

onlineManager.setEventListener(setOnline => {
  const handleNetworkChange = (state: NetworkState) => setOnline(!!state.isConnected);
  const subscription = addNetworkStateListener(handleNetworkChange);
  getNetworkStateAsync()
    .then(handleNetworkChange)
    .catch(() => {});
  return () => subscription.remove();
});
