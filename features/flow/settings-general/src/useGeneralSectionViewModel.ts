import { useCallback, useMemo } from "react";
import type { SettingsRowSelectOption, SettingsTheme } from "@features/flow-settings";
import { useGeneralSectionLabels, type GeneralSectionLabels } from "./copy/useGeneralSectionLabels";
import { useGeneralSettingsPort } from "./useGeneralSettingsPort";

const THEMES: readonly SettingsTheme[] = ["system", "light", "dark"];
const THEME_VALUES: ReadonlySet<string> = new Set(THEMES);

function isTheme(value: string): value is SettingsTheme {
  return THEME_VALUES.has(value);
}

type SelectRow = Readonly<{
  value: string;
  options: readonly SettingsRowSelectOption[];
  onSelect: (value: string) => void;
}>;

export type GeneralSectionViewModel = Readonly<{
  labels: GeneralSectionLabels;
  ledgerSync: Readonly<{ actionLabel: string; onOpen: () => void }>;
  theme: SelectRow;
  language: SelectRow;
  currency: SelectRow;
}>;

/** The rows of the General section, read from and written to the app's settings port. */
export function useGeneralSectionViewModel(): GeneralSectionViewModel {
  const labels = useGeneralSectionLabels();
  const { values, setValue, languages, currencies, ledgerSync } = useGeneralSettingsPort();
  const { theme, language, currency } = values;

  const themeOptions = useMemo(
    () => THEMES.map(value => ({ value, label: labels.theme.options[value] })),
    [labels],
  );
  const currencyOptions = useMemo(
    () => currencies.map(choice => ({ ...choice, shortLabel: choice.value })),
    [currencies],
  );

  const onSelectTheme = useCallback(
    (value: string) => {
      if (isTheme(value)) setValue({ key: "theme", value });
    },
    [setValue],
  );
  const onSelectLanguage = useCallback(
    (value: string) => setValue({ key: "language", value }),
    [setValue],
  );
  const onSelectCurrency = useCallback(
    (value: string) => setValue({ key: "currency", value }),
    [setValue],
  );

  return {
    labels,
    ledgerSync: {
      actionLabel: ledgerSync.isActive ? labels.ledgerSync.manage : labels.ledgerSync.activate,
      onOpen: ledgerSync.open,
    },
    theme: { value: theme, options: themeOptions, onSelect: onSelectTheme },
    language: { value: language, options: languages, onSelect: onSelectLanguage },
    currency: { value: currency, options: currencyOptions, onSelect: onSelectCurrency },
  };
}
