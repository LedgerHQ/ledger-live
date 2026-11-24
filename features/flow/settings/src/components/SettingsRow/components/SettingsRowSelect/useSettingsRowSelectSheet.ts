import { useCallback, useMemo, useState } from "react";
import { getSelectedOptionLabel } from "../../../../logic/settingsRowTrailing";
import type { SettingsRowSelectProps } from "./SettingsRowSelect.types";

/** Open state and choice of the select sheet: the native select picks its option in a sheet. */
export function useSettingsRowSelectSheet({
  value,
  options,
  onSelectOption,
}: SettingsRowSelectProps["trailing"]) {
  const [isOpen, setIsOpen] = useState(false);
  const items = useMemo(
    () => options.map(option => ({ value: option.value, label: option.label })),
    [options],
  );
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const onValueChange = useCallback(
    (selected: string | null) => {
      setIsOpen(false);
      if (selected !== null && selected !== value) onSelectOption(selected);
    },
    [value, onSelectOption],
  );

  return {
    isOpen,
    open,
    close,
    items,
    onValueChange,
    selectedLabel: getSelectedOptionLabel(options, value),
  };
}
