import React from "react";
import type { SettingsHomeSectionId } from "../../logic/settingsHomeSections";
import { SettingsHomeView } from "./SettingsHomeView";
import { useSettingsHomeViewModel } from "./useSettingsHomeViewModel";

export type SettingsHomeProps = Readonly<{
  onSelectSection: (section: SettingsHomeSectionId) => void;
  testID?: string;
}>;

/** Mobile Settings home: one row per section, each opening its screen. */
export function SettingsHome({ onSelectSection, testID }: SettingsHomeProps) {
  return <SettingsHomeView {...useSettingsHomeViewModel({ onSelectSection })} testID={testID} />;
}
