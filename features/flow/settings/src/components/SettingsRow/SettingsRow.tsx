import React from "react";
import type { SettingsRowProps } from "./SettingsRow.types";
import { SettingsRowView } from "./SettingsRowView";
import { useSettingsRowViewModel } from "./useSettingsRowViewModel";

export function SettingsRow(props: SettingsRowProps) {
  const viewModel = useSettingsRowViewModel(props);
  return viewModel ? <SettingsRowView {...viewModel} /> : null;
}
