import { useCallback, useMemo, useState } from "react";
import type { SettingsRowSelectOption } from "@features/flow-settings";
import {
  useGeneralSectionViewModel,
  type GeneralSectionViewModel,
} from "../useGeneralSectionViewModel";

export type GeneralSheetId = "theme" | "language" | "currency";

export type GeneralSheet = Readonly<{
  id: GeneralSheetId;
  title: string;
  value: string;
  options: readonly SettingsRowSelectOption[];
  /** Long lists get a search field. */
  hasSearch: boolean;
  onSelect: (value: string) => void;
}>;

export type GeneralSectionSheetsViewModel = GeneralSectionViewModel &
  Readonly<{
    /** The label of each row's current value, shown as its description. */
    currentLabels: Readonly<Record<GeneralSheetId, string>>;
    openSheet: GeneralSheet | null;
    onOpenSheet: (id: GeneralSheetId) => void;
    onCloseSheet: () => void;
  }>;

function labelOf(options: readonly SettingsRowSelectOption[], value: string): string {
  return options.find(option => option.value === value)?.label ?? value;
}

/** The General section on mobile: each row shows its value and opens a sheet to pick another. */
export function useGeneralSectionSheetsViewModel(): GeneralSectionSheetsViewModel {
  const section = useGeneralSectionViewModel();
  const [openSheetId, setOpenSheetId] = useState<GeneralSheetId | null>(null);
  const { labels, theme, language, currency } = section;

  const onOpenSheet = useCallback((id: GeneralSheetId) => setOpenSheetId(id), []);
  const onCloseSheet = useCallback(() => setOpenSheetId(null), []);

  const sheets = useMemo<Readonly<Record<GeneralSheetId, GeneralSheet>>>(
    () => ({
      theme: {
        id: "theme",
        title: labels.theme.sheetTitle,
        value: theme.value,
        options: theme.options,
        hasSearch: false,
        onSelect: theme.onSelect,
      },
      language: {
        id: "language",
        title: labels.language.sheetTitle,
        value: language.value,
        options: language.options,
        hasSearch: true,
        onSelect: language.onSelect,
      },
      currency: {
        id: "currency",
        title: labels.currency.sheetTitle,
        value: currency.value,
        options: currency.options,
        hasSearch: true,
        onSelect: currency.onSelect,
      },
    }),
    [labels, theme, language, currency],
  );

  return {
    ...section,
    currentLabels: {
      theme: labelOf(theme.options, theme.value),
      language: labelOf(language.options, language.value),
      currency: currency.value,
    },
    openSheet: openSheetId ? sheets[openSheetId] : null,
    onOpenSheet,
    onCloseSheet,
  };
}
