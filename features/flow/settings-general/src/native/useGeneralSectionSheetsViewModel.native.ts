import { useCallback, useMemo, useState } from "react";
import type { SettingsRowSelectOption } from "@features/flow-settings";
import { useDateFormatLabels } from "../copy/useDateFormatLabels";
import { isSettingsDateFormat, SETTINGS_DATE_FORMATS } from "../logic/dateFormat";
import { useDateFormatSettingsPort } from "../useGeneralSettingsPort";
import {
  useGeneralSectionViewModel,
  type GeneralSectionViewModel,
} from "../useGeneralSectionViewModel";

export type GeneralSheetId = "theme" | "language" | "dateFormat" | "currency";

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
    /** The title of each row. */
    rowTitles: Readonly<Record<GeneralSheetId, string>>;
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
  const dateFormatLabels = useDateFormatLabels();
  const dateFormatPort = useDateFormatSettingsPort();
  const dateFormat = dateFormatPort.values.dateFormat;
  const setDateFormatValue = dateFormatPort.setValue;

  const dateFormatOptions = useMemo(
    () => SETTINGS_DATE_FORMATS.map(value => ({ value, label: dateFormatLabels.options[value] })),
    [dateFormatLabels],
  );
  const onSelectDateFormat = useCallback(
    (value: string) => {
      if (isSettingsDateFormat(value)) setDateFormatValue({ key: "dateFormat", value });
    },
    [setDateFormatValue],
  );

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
      dateFormat: {
        id: "dateFormat",
        title: dateFormatLabels.sheetTitle,
        value: dateFormat,
        options: dateFormatOptions,
        hasSearch: false,
        onSelect: onSelectDateFormat,
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
    [
      labels,
      theme,
      language,
      currency,
      dateFormat,
      dateFormatLabels,
      dateFormatOptions,
      onSelectDateFormat,
    ],
  );

  return {
    ...section,
    rowTitles: {
      theme: labels.theme.title,
      language: labels.language.title,
      dateFormat: dateFormatLabels.title,
      currency: labels.currency.title,
    },
    currentLabels: {
      theme: labelOf(theme.options, theme.value),
      language: labelOf(language.options, language.value),
      dateFormat: labelOf(dateFormatOptions, dateFormat),
      currency: currency.value,
    },
    openSheet: openSheetId ? sheets[openSheetId] : null,
    onOpenSheet,
    onCloseSheet,
  };
}
