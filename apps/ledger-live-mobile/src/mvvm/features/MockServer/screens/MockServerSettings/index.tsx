import React from "react";
import { MockServerSettingsView } from "./MockServerSettingsView";
import { useMockServerSettingsViewModel } from "./useMockServerSettingsViewModel";

export function MockServerSettingsScreen() {
  return <MockServerSettingsView {...useMockServerSettingsViewModel()} />;
}
