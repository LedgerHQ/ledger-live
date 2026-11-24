import React from "react";
import type { SettingsOptionListProps } from "./SettingsOptionList.types";
import { SettingsOptionListView } from "./SettingsOptionListView";
import { useSettingsOptionListViewModel } from "./useSettingsOptionListViewModel";

export function SettingsOptionList(props: SettingsOptionListProps) {
  return <SettingsOptionListView {...useSettingsOptionListViewModel(props)} />;
}
