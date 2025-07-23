import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui/index";
import Select from "~/renderer/components/Select";
import { SelectOption } from "./types";

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
    <Flex flexDirection="row" alignItems="center">
      <Text variant="body" fontSize="14px" mr="2">
        {label}
      </Text>
      <Select
        value={value}
        options={options}
        onChange={option => option && onChange(option)}
        isSearchable={false}
        minWidth={250}
      />
    </Flex>
  );
};
