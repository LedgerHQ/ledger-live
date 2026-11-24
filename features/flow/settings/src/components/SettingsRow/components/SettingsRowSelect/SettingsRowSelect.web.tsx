import React, { useCallback } from "react";
import {
  MediaButton,
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectList,
  SelectTrigger,
} from "@ledgerhq/lumen-ui-react";
import { getSelectedOptionLabel } from "../../../../logic/settingsRowTrailing";
import type { SettingsRowSelectProps } from "./SettingsRowSelect.types";

export function SettingsRowSelect({ trailing, rowTitle, disabled }: SettingsRowSelectProps) {
  const { value, options, onSelectOption } = trailing;
  const onValueChange = useCallback(
    (selected: string | null) => {
      if (selected !== null) onSelectOption(selected);
    },
    [onSelectOption],
  );
  const selectedLabel = getSelectedOptionLabel(options, value);

  return (
    <Select items={[...options]} value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        render={() => (
          <MediaButton appearance="gray" size="sm" disabled={disabled} aria-label={rowTitle}>
            {selectedLabel}
          </MediaButton>
        )}
      />
      <SelectContent>
        <SelectList
          renderItem={item => (
            <SelectItem key={item.value} value={item.value}>
              <SelectItemText>{item.label}</SelectItemText>
            </SelectItem>
          )}
        />
      </SelectContent>
    </Select>
  );
}
