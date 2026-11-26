import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import { useSettingsLabels } from "../../copy/useSettingsLabels";
import {
  SETTINGS_HOME_SECTIONS,
  type SettingsHomeSectionId,
} from "../../logic/settingsHomeSections";
import type { SettingsHomeDevTools } from "./SettingsHomeDevTools";

export type SettingsHomeRow = Readonly<{ id: SettingsHomeSectionId; label: string }>;

export type SettingsHomeDevToolRow = Readonly<{
  id: "developer" | "debug";
  label: string;
  onSelect: () => void;
}>;

export type SettingsHomeViewModel = Readonly<{
  rows: readonly SettingsHomeRow[];
  devToolRows: readonly SettingsHomeDevToolRow[];
  onSelectSection: (section: SettingsHomeSectionId) => void;
}>;

type SettingsHomeViewModelInput = Readonly<{
  onSelectSection: (section: SettingsHomeSectionId) => void;
  devTools?: SettingsHomeDevTools;
}>;

export function useSettingsHomeViewModel({
  onSelectSection,
  devTools,
}: SettingsHomeViewModelInput): SettingsHomeViewModel {
  const { t } = useTranslation();
  const labels = useSettingsLabels();
  const rows = useMemo(
    () => SETTINGS_HOME_SECTIONS.map(id => ({ id, label: labels.sections[id] })),
    [labels],
  );
  const onOpenDeveloper = devTools?.onOpenDeveloper;
  const onOpenDebug = devTools?.onOpenDebug;
  const devToolRows = useMemo(() => {
    const devToolRows: SettingsHomeDevToolRow[] = [];
    if (onOpenDeveloper) {
      devToolRows.push({
        id: "developer",
        label: t("settings.developer.title"),
        onSelect: onOpenDeveloper,
      });
    }
    if (onOpenDebug) {
      devToolRows.push({ id: "debug", label: t("settings.debug.title"), onSelect: onOpenDebug });
    }
    return devToolRows;
  }, [onOpenDeveloper, onOpenDebug, t]);

  return { rows, devToolRows, onSelectSection };
}
