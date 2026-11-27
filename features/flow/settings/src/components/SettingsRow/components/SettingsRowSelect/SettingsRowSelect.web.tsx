import React, { useCallback } from "react";
import {
  MediaButton,
  Select,
  SelectContent,
  SelectEmptyState,
  SelectItem,
  SelectItemText,
  SelectList,
  SelectSearch,
  SelectTrigger,
} from "@ledgerhq/lumen-ui-react";
import {
  getSelectedOptionLabel,
  matchesSettingsOption,
} from "../../../../logic/settingsRowTrailing";
import type { SettingsRowSelectProps } from "./SettingsRowSelect.types";

export function SettingsRowSelect({ trailing, rowTitle, disabled }: SettingsRowSelectProps) {
  const { value, options, onSelectOption, search } = trailing;
  const onValueChange = useCallback(
    (selected: string | null) => {
      if (selected !== null) onSelectOption(selected);
    },
    [onSelectOption],
  );
  const selectedLabel = getSelectedOptionLabel(options, value);

  return (
    <Select
      items={[...options]}
      value={value}
      onValueChange={onValueChange}
      filter={matchesSettingsOption}
      disabled={disabled}
    >
      <SelectTrigger
        render={() => (
          <MediaButton appearance="gray" size="sm" disabled={disabled} aria-label={rowTitle}>
            {selectedLabel}
          </MediaButton>
        )}
      />
      <SelectContent
        align="end"
        className="max-h-[min(var(--available-height,320px),320px)] w-max min-w-[256px] max-w-(--available-width)"
      >
        {search && <SelectSearch placeholder={search.placeholder} />}
        {search && <SelectEmptyState title={search.emptyLabel} />}
        <SelectList
          renderItem={item => (
            <SelectItem key={item.value} value={item.value}>
              <SelectItemText>{item.label}</SelectItemText>
              {item.description && (
                <span className="ms-auto body-3 text-muted group-data-selected/item:hidden">
                  {item.description}
                </span>
              )}
            </SelectItem>
          )}
        />
      </SelectContent>
    </Select>
  );
}
