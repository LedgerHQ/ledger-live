import React, { type ReactNode } from "react";
import { ScrollView } from "react-native";
import { TrackScreen } from "@shared/analytics-react";
import { HiddenSettingsProvider } from "../../components/HiddenSettingsProvider/HiddenSettingsProvider";
import type { SettingsHomeSectionId } from "../../logic/settingsHomeSections";
import { SettingsHome } from "../SettingsHome/SettingsHome";
import { useSettingsHomeGateViewModel } from "./useSettingsHomeGateViewModel";

export type SettingsHomeGateProps = Readonly<{
  onSelectSection: (section: SettingsHomeSectionId) => void;
  /** Shown while the new Settings are off. */
  legacySettings: ReactNode;
  /** Rows the app hides, given to `HiddenSettingsProvider`. */
  rowsToHide: unknown;
  testID?: string;
}>;

/** Shows the new mobile Settings home behind the flag, or the legacy home. */
export function SettingsHomeGate({
  onSelectSection,
  legacySettings,
  rowsToHide,
  testID,
}: SettingsHomeGateProps) {
  const { showLegacySettings } = useSettingsHomeGateViewModel();

  if (showLegacySettings) return <>{legacySettings}</>;

  return (
    <HiddenSettingsProvider rowsToHide={rowsToHide}>
      <TrackScreen category="Settings" />
      <ScrollView>
        <SettingsHome onSelectSection={onSelectSection} testID={testID} />
      </ScrollView>
    </HiddenSettingsProvider>
  );
}
