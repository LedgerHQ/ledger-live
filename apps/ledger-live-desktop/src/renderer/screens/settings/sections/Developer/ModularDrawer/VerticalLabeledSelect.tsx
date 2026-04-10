import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui/index";
import { SelectOption } from "./types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectList,
  SelectTrigger,
} from "@ledgerhq/lumen-ui-react";
interface VerticalLabeledSelectProps<T = SelectOption> {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (option: T) => void;
  width?: string;
}

export const VerticalLabeledSelect = <T extends SelectOption>({
  label,
  value,
  options,
  onChange,
  width = "250px",
}: VerticalLabeledSelectProps<T>) => {
  const items = options.map(option => ({ value: option.value, label: option.label }));

  return (
    <Flex flexDirection="column" justifyContent="center" width={width}>
      <Text variant="body" fontSize="14px" mb="2">
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
    </Flex>
  );
};
