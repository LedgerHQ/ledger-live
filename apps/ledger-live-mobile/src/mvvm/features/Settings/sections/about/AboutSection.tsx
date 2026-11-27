import React from "react";
import { SettingsAbout } from "@features/flow-settings-about";
import { TrackScreen } from "@shared/analytics-react";
import { useAboutSettingsAdapter } from "./useAboutSettingsAdapter";

/** The About section of the new Settings on mobile, behind the `newSettings` flag. */
export function AboutSection() {
  const port = useAboutSettingsAdapter();
  return (
    <>
      <TrackScreen category="Settings" name="About" />
      <SettingsAbout port={port} testID="settings-about" />
    </>
  );
}
