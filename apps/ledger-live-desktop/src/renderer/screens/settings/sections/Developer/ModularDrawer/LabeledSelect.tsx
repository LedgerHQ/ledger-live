import React from "react";
import { Text } from "@ledgerhq/react-ui/index";
import { SelectOption } from "./types";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItemText,
  SelectItem,
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
  return (
    <div className="flex w-400 flex-row items-center">
      <Text variant="body" fontSize="14px" mr="2">
        {label}
      </Text>

      <Select
        value={value.value}
        onValueChange={option => {
          const found = option && options.find(o => o.value === option);
          if (found) onChange(found);
        }}
      >
        <SelectTrigger label={label} />
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              <SelectItemText>{option.label}</SelectItemText>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
