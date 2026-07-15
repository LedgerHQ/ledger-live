import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectList,
  SelectTrigger,
} from "@ledgerhq/lumen-ui-react";
import React from "react";

type StrategyOptionWithLabel = Readonly<{ value: number; label: string }>;

type StrategySelectProps = Readonly<{
  onValueChange: (value: string) => void;
  options: readonly StrategyOptionWithLabel[];
  value: string;
  strategyLabel: string;
}>;

export const StrategySelect = ({
  onValueChange,
  options,
  value,
  strategyLabel,
}: StrategySelectProps) => {
  const items = options.map(option => ({
    value: String(option.value),
    label: option.label,
  }));

  return (
    <div className="flex flex-col gap-12 pt-8">
      <Select
        value={value}
        onValueChange={v => {
          if (v != null) onValueChange(v);
        }}
        items={items}
      >
        <SelectTrigger label={strategyLabel} />
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
    </div>
  );
};
