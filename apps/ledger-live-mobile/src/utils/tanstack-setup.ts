import { onlineManager } from "@tanstack/react-query";
import { subscribeToNetworkState } from "~/logic/subscribeToNetworkState";

onlineManager.setEventListener(setOnline =>
  subscribeToNetworkState(state => {
    setOnline(!!state.isConnected);
  }),
);
