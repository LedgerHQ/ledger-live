import React from "react";
import type { SettingsAboutProps } from "./SettingsAbout.types";
import { SettingsAboutView } from "./SettingsAboutView";
import { useSettingsAboutViewModel } from "./useSettingsAboutViewModel";

export function SettingsAbout(props: SettingsAboutProps) {
  return <SettingsAboutView {...useSettingsAboutViewModel(props)} />;
}
