import React from "react";
import type { SettingsHomeSectionId } from "../../logic/settingsHomeSections";
import type { SettingsHomeDevTools } from "./SettingsHomeDevTools";
import { SettingsHomeView } from "./SettingsHomeView";
import { useSettingsHomeViewModel } from "./useSettingsHomeViewModel";

export type SettingsHomeProps = Readonly<{
  onSelectSection: (section: SettingsHomeSectionId) => void;
  /** Rows to the developer tools, after the sections. */
  devTools?: SettingsHomeDevTools;
  testID?: string;
}>;

/** Mobile Settings home: one row per section, each opening its screen. */
export function SettingsHome({ onSelectSection, devTools, testID }: SettingsHomeProps) {
  return (
    <SettingsHomeView
      {...useSettingsHomeViewModel({ onSelectSection, devTools })}
      testID={testID}
    />
  );
}
