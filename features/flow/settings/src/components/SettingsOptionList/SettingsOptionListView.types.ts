import type { SettingsOption } from "./SettingsOptionList.types";

export type SettingsOptionListItem = SettingsOption & Readonly<{ isSelected: boolean }>;

export type SettingsOptionListViewProps = Readonly<{
  items: readonly SettingsOptionListItem[];
  onSelectOption: (value: string) => void;
  search?: Readonly<{
    placeholder: string;
    query: string;
    onChangeQuery: (query: string) => void;
  }>;
  /** Set when a search matches no option. */
  emptyLabel?: string;
  testID?: string;
}>;
