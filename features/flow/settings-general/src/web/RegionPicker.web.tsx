import React from "react";
import {
  ListItem,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  SearchInput,
} from "@ledgerhq/lumen-ui-react";
import { Check } from "@ledgerhq/lumen-ui-react/symbols";
import { SettingsSheet } from "@features/flow-settings";
import type { RegionPickerViewModel } from "./useRegionPickerViewModel";

type RegionPickerProps = Readonly<{ region: RegionPickerViewModel }>;

/** The region dialog: a search field over the regions, the current one checked. */
export function RegionPicker({ region }: RegionPickerProps) {
  const { labels } = region;
  return (
    <SettingsSheet
      isOpen={region.isPickerOpen}
      title={labels.dialogTitle}
      description={labels.dialogDescription}
      headerDensity="expanded"
      onClose={region.onClosePicker}
      testID="settings-general-region-picker"
    >
      <div className="flex flex-col gap-12 pt-4">
        <SearchInput
          placeholder={labels.search.placeholder}
          value={region.query}
          onChange={event => region.onQueryChange(event.target.value)}
        />
        <div className="max-h-[360px] overflow-y-auto">
          {region.options.length === 0 ? (
            <span className="body-2 text-muted">{labels.search.emptyLabel}</span>
          ) : (
            region.options.map(option => (
              <ListItem
                key={option.value}
                density="compact"
                className="shrink-0"
                onClick={() => region.onSelect(option.value)}
                aria-current={option.value === region.value ? "true" : undefined}
                data-testid={`settings-general-region-${option.value}`}
              >
                <ListItemLeading>
                  <ListItemTitle className="body-2-semi-bold">{option.label}</ListItemTitle>
                </ListItemLeading>
                {option.value === region.value ? (
                  <ListItemTrailing>
                    <Check size={20} className="text-active" />
                  </ListItemTrailing>
                ) : null}
              </ListItem>
            ))
          )}
        </div>
      </div>
    </SettingsSheet>
  );
}
