import React from "react";
import { TrackScreen } from "@shared/analytics-react";
import type { SettingsAboutProps } from "./SettingsAbout.types";
import { SettingsAboutView } from "./SettingsAboutView";
import { useSettingsAboutViewModel } from "./useSettingsAboutViewModel";

export function SettingsAbout(props: SettingsAboutProps) {
  return (
    <>
      <TrackScreen category="Settings" name="About" />
      <SettingsAboutView {...useSettingsAboutViewModel(props)} />
    </>
  );
}
