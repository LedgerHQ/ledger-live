import { useMemo } from "react";
import { useSettingsLabels } from "../../copy/useSettingsLabels";
import {
  SETTINGS_HOME_SECTIONS,
  type SettingsHomeSectionId,
} from "../../logic/settingsHomeSections";

export type SettingsHomeRow = Readonly<{ id: SettingsHomeSectionId; label: string }>;

export type SettingsHomeViewModel = Readonly<{
  rows: readonly SettingsHomeRow[];
  onSelectSection: (section: SettingsHomeSectionId) => void;
}>;

type SettingsHomeViewModelInput = Readonly<{
  onSelectSection: (section: SettingsHomeSectionId) => void;
}>;

export function useSettingsHomeViewModel({
  onSelectSection,
}: SettingsHomeViewModelInput): SettingsHomeViewModel {
  const labels = useSettingsLabels();
  const rows = useMemo(
    () => SETTINGS_HOME_SECTIONS.map(id => ({ id, label: labels.sections[id] })),
    [labels],
  );

  return { rows, onSelectSection };
}
