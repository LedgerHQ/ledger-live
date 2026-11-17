import React from "react";
import { MockServerSettingsRowView } from "./MockServerSettingsRowView";
import { useMockServerSettingsRowViewModel } from "./useMockServerSettingsRowViewModel";

export function MockServerSettingsRow() {
  return <MockServerSettingsRowView {...useMockServerSettingsRowViewModel()} />;
}
