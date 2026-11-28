import React from "react";
import { OsUpdateFlowView } from "./OsUpdateFlowView";
import { useOsUpdateFlowViewModel, type OsUpdateFlowProps } from "./useOsUpdateFlowViewModel";

/** The OS update journey, from its What's new screen to the end of the orchestrator run. */
export function OsUpdateFlow(props: OsUpdateFlowProps) {
  return <OsUpdateFlowView {...useOsUpdateFlowViewModel(props)} />;
}
