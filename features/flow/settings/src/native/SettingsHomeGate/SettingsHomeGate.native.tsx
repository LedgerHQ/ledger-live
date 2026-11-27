import React, { type ReactNode } from "react";
import { TrackScreen } from "@shared/analytics-react";
import { HiddenSettingsProvider } from "../../components/HiddenSettingsProvider/HiddenSettingsProvider";
import type { SettingsHomeSectionId } from "../../logic/settingsHomeSections";
import { SettingsHome } from "../SettingsHome/SettingsHome";
import type { SettingsHomeDevTools } from "../SettingsHome/SettingsHomeDevTools";
import { SettingsScrollView } from "../SettingsScrollView/SettingsScrollView";
import { useSettingsHomeGateViewModel } from "./useSettingsHomeGateViewModel";

export type SettingsHomeGateProps = Readonly<{
  onSelectSection: (section: SettingsHomeSectionId) => void;
  /** Shown while the new Settings are off. */
  legacySettings: ReactNode;
  /** Rows the app hides, given to `HiddenSettingsProvider`. */
  rowsToHide: unknown;
  /** Rows to the developer tools, after the sections. */
  devTools?: SettingsHomeDevTools;
  /** Last row of the new home, back to the legacy Settings. No row without it. */
  onSwitchToLegacySettings?: () => void;
  testID?: string;
}>;

/** Shows the new mobile Settings home behind the flag, or the legacy home. */
export function SettingsHomeGate({
  onSelectSection,
  legacySettings,
  rowsToHide,
  devTools,
  onSwitchToLegacySettings,
  testID,
}: SettingsHomeGateProps) {
  const { showLegacySettings } = useSettingsHomeGateViewModel();

  if (showLegacySettings) return <>{legacySettings}</>;

  return (
    <HiddenSettingsProvider rowsToHide={rowsToHide}>
      <TrackScreen category="Settings" />
      <SettingsScrollView>
        <SettingsHome
          onSelectSection={onSelectSection}
          devTools={devTools}
          onSwitchToLegacySettings={onSwitchToLegacySettings}
          testID={testID}
        />
      </SettingsScrollView>
    </HiddenSettingsProvider>
  );
}
