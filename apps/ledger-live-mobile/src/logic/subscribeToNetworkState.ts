import { addNetworkStateListener, getNetworkStateAsync, type NetworkState } from "expo-network";

export function subscribeToNetworkState(listener: (state: NetworkState) => void): () => void {
  let isActive = true;
  let hasReceivedEvent = false;

  const subscription = addNetworkStateListener(state => {
    hasReceivedEvent = true;
    listener(state);
  });

  getNetworkStateAsync()
    .then(state => {
      if (isActive && !hasReceivedEvent) listener(state);
    })
    .catch(() => {});

  return () => {
    isActive = false;
    subscription.remove();
  };
}
