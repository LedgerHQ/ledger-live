import { useMemo, useState } from "react";
import type { SettingsOptionListProps } from "./SettingsOptionList.types";
import type { SettingsOptionListViewProps } from "./SettingsOptionListView.types";
import { filterSettingsOptions } from "./model/filterSettingsOptions";

export function useSettingsOptionListViewModel({
  options,
  selectedValue,
  onSelectOption,
  search,
  testID,
}: SettingsOptionListProps): SettingsOptionListViewProps {
  const [query, setQuery] = useState("");

  const items = useMemo(
    () =>
      filterSettingsOptions(options, search ? query : "").map(option => ({
        ...option,
        isSelected: option.value === selectedValue,
      })),
    [options, search, query, selectedValue],
  );

  return {
    items,
    onSelectOption,
    search: search && { placeholder: search.placeholder, query, onChangeQuery: setQuery },
    emptyLabel: search && items.length === 0 ? search.emptyLabel : undefined,
    testID,
  };
}
