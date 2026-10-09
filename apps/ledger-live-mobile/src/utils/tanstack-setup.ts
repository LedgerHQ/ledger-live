import { onlineManager } from "@tanstack/react-query";
import { subscribeToNetworkState } from "@shared/network-status";

onlineManager.setEventListener(setOnline =>
  subscribeToNetworkState(state => {
    setOnline(!!state.isConnected);
  }),
);
