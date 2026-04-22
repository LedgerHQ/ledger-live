import React from "react";
import { Text } from "@ledgerhq/react-ui/index";
import { SelectOption } from "./types";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItemText,
  SelectItem,
  SelectList,
} from "@ledgerhq/lumen-ui-react";

interface LabeledSelectProps<T extends SelectOption = SelectOption> {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (option: T) => void;
}

export const LabeledSelect = <T extends SelectOption = SelectOption>({
  label,
  value,
  options,
  onChange,
}: LabeledSelectProps<T>) => {
  const items = options.map(option => ({ value: option.value, label: option.label }));

  return (
    <div className="flex w-400 flex-row items-center">
      <Text variant="body" fontSize="14px" mr="2">
        {label}
      </Text>

      <Select
        value={value.value}
        items={items}
        onValueChange={option => {
          if (option == null) return;
          const found = options.find(o => o.value === option);
          if (found) onChange(found);
        }}
      >
        <SelectTrigger label={label} />
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
