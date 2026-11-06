import React from "react";
import { OsUpdatesDebugHubView } from "./OsUpdatesDebugHubView";
import { useOsUpdatesDebugHubViewModel } from "./useOsUpdatesDebugHubViewModel";

export default function OsUpdatesDebugHub() {
  return <OsUpdatesDebugHubView {...useOsUpdatesDebugHubViewModel()} />;
}
