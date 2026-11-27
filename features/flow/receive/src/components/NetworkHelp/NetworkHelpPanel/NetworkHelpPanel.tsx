import React from "react";
import { NetworkHelpPanelView } from "./NetworkHelpPanelView";
import { useNetworkHelpPanelViewModel } from "./useNetworkHelpPanelViewModel";

/** "How to select the network?": the body, under a header the host gives. */
export function NetworkHelpPanel() {
  return <NetworkHelpPanelView {...useNetworkHelpPanelViewModel()} />;
}
