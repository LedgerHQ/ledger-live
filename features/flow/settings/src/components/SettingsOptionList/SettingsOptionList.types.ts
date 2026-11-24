import type { ReactNode } from "react";

export type SettingsOption = Readonly<{
  value: string;
  label: string;
  /** Short code shown on the right, e.g. "ARS"; search matches it too. */
  trailingText?: string;
  icon?: ReactNode;
}>;

export type SettingsOptionListSearch = Readonly<{
  placeholder: string;
  /** Shown when no option matches the search. */
  emptyLabel: string;
}>;

export type SettingsOptionListProps = Readonly<{
  options: readonly SettingsOption[];
  selectedValue?: string;
  onSelectOption: (value: string) => void;
  /** Adds a search field above the options. */
  search?: SettingsOptionListSearch;
  testID?: string;
}>;
