import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectList,
  SelectTrigger,
} from "@ledgerhq/lumen-ui-react";
import type { SelectOption } from "../utils/types";

type DevLabeledSelectProps<T extends SelectOption> = {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (option: T) => void;
  className?: string;
  hideLabel?: boolean;
};

export const DevLabeledSelect = <T extends SelectOption>({
  label,
  value,
  options,
  onChange,
  className,
  hideLabel = false,
}: DevLabeledSelectProps<T>) => {
  const items = options.map(option => ({ value: option.value, label: option.label }));
  const triggerLabel = hideLabel ? value.label : label;

  return (
    <div className={`flex min-w-[220px] flex-col gap-3 py-2 ${className ?? ""}`}>
      {hideLabel ? null : <span className="body-3-semi-bold text-muted">{label}</span>}
      <div className="py-1">
        <Select
          value={value.value}
          items={items}
          onValueChange={option => {
            if (option == null) return;
            const found = options.find(o => o.value === option);
            if (found) onChange(found);
          }}
        >
          <SelectTrigger label={triggerLabel} />
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
    </div>
  );
};
