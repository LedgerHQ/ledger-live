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

type RangeOption = { value: string; label: string };

type MarketRangeSelectProps = Readonly<{
  options: RangeOption[];
  value?: RangeOption;
  onChange: (option: RangeOption | null) => void;
}>;

export function MarketRangeSelect({ options, value, onChange }: MarketRangeSelectProps) {
  const onValueChange = useCallback(
    (selected: string | null) => {
      if (selected == null) return;
      onChange(options.find(option => option.value === selected) ?? null);
    },
    [onChange, options],
  );

  const selectedLabel = options.find(option => option.value === value?.value)?.label;

  return (
    <Select items={options} value={value?.value ?? null} onValueChange={onValueChange}>
      <SelectTrigger
        render={() => (
          <MediaButton appearance="no-background" size="sm" data-testid="market-range-select">
            {selectedLabel}
          </MediaButton>
        )}
      />
      <SelectContent className="min-w-176 bg-muted">
        <SelectList
          renderItem={item => (
            <SelectItem
              key={item.value}
              value={item.value}
              data-testid={`market-range-option-${item.value}`}
            >
              <SelectItemText>{item.label}</SelectItemText>
            </SelectItem>
          )}
        />
      </SelectContent>
    </Select>
  );
}
